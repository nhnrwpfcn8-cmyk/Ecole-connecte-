import React, { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function AdminDashboard({
  session,
  onLogout
}) {
  const [activeSection, setActiveSection] =
    useState("overview");

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [schools, setSchools] =
    useState([]);

  const [teachers, setTeachers] =
    useState([]);

  const [students, setStudents] =
    useState([]);

  const [classes, setClasses] =
    useState([]);

  const [subjects, setSubjects] =
    useState([]);

  const [documents, setDocuments] =
    useState([]);

  const [exercises, setExercises] =
    useState([]);

  const [questions, setQuestions] =
    useState([]);

  const [attendance, setAttendance] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  /* =========================
     FORMULAIRES
  ========================= */

  const [showSchoolForm, setShowSchoolForm] =
    useState(false);

  const [schoolName, setSchoolName] =
    useState("");

  const [schoolAddress, setSchoolAddress] =
    useState("");

  const [schoolCity, setSchoolCity] =
    useState("Dakar");

  const [schoolPhone, setSchoolPhone] =
    useState("");

  const [schoolEmail, setSchoolEmail] =
    useState("");

  const [savingSchool, setSavingSchool] =
    useState(false);

  const [showClassForm, setShowClassForm] =
    useState(false);

  const [className, setClassName] =
    useState("");

  const [classLevel, setClassLevel] =
    useState("");

  const [selectedSchoolId, setSelectedSchoolId] =
    useState("");

  const [savingClass, setSavingClass] =
    useState(false);

  const [showSubjectForm, setShowSubjectForm] =
    useState(false);

  const [subjectName, setSubjectName] =
    useState("");

  const [savingSubject, setSavingSubject] =
    useState(false);

  const [showStudentForm, setShowStudentForm] =
    useState(false);

  const [studentFirstName, setStudentFirstName] =
    useState("");

  const [studentLastName, setStudentLastName] =
    useState("");

  const [studentCode, setStudentCode] =
    useState("");

  const [studentSchoolId, setStudentSchoolId] =
    useState("");

  const [studentClassId, setStudentClassId] =
    useState("");

  const [savingStudent, setSavingStudent] =
    useState(false);

  /* =========================
     CHARGEMENT
  ========================= */

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setMessage("");

    try {
      const results =
        await Promise.all([
          supabase
            .from("schools")
            .select("*")
            .order("name"),

          supabase
            .from("profiles")
            .select(
              "id, full_name, phone, role, school_id"
            )
            .eq("role", "teacher")
            .order("full_name"),

          supabase
            .from("students")
            .select("*")
            .order("last_name"),

          supabase
            .from("classes")
            .select("*")
            .order("name"),

          supabase
            .from("subjects")
            .select("*")
            .order("name"),

          supabase
            .from("documents")
            .select("*")
            .order("created_at", {
              ascending: false
            }),

          supabase
            .from("exercises")
            .select("*")
            .order("created_at", {
              ascending: false
            }),

          supabase
            .from("exercise_questions")
            .select("*")
            .order("position"),

          supabase
            .from("attendance")
            .select("*")
            .order("date", {
              ascending: false
            }),

          supabase
            .from("notifications")
            .select("*")
            .order("created_at", {
              ascending: false
            })
        ]);

      const [
        schoolsResult,
        teachersResult,
        studentsResult,
        classesResult,
        subjectsResult,
        documentsResult,
        exercisesResult,
        questionsResult,
        attendanceResult,
        notificationsResult
      ] = results;

      const firstError = results.find(
        (result) => result.error
      );

      if (firstError?.error) {
        console.error(
          "Erreur chargement :",
          firstError.error
        );

        setMessage(
          "Certaines données n'ont pas pu être chargées : " +
          firstError.error.message
        );
      }

      setSchools(
        schoolsResult.data || []
      );

      setTeachers(
        teachersResult.data || []
      );

      setStudents(
        studentsResult.data || []
      );

      setClasses(
        classesResult.data || []
      );

      setSubjects(
        subjectsResult.data || []
      );

      setDocuments(
        documentsResult.data || []
      );

      setExercises(
        exercisesResult.data || []
      );

      setQuestions(
        questionsResult.data || []
      );

      setAttendance(
        attendanceResult.data || []
      );

      setNotifications(
        notificationsResult.data || []
      );

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur : " + error.message
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     ÉCOLES
  ========================= */

  async function createSchool() {
    setMessage("");

    if (!schoolName.trim()) {
      setMessage(
        "Le nom de l'école est obligatoire."
      );
      return;
    }

    setSavingSchool(true);

    try {
      const {
        error
      } = await supabase
        .from("schools")
        .insert({
          name: schoolName.trim(),
          address:
            schoolAddress.trim() || null,
          city:
            schoolCity.trim() || null,
          phone:
            schoolPhone.trim() || null,
          email:
            schoolEmail.trim() || null
        });

      if (error) {
        throw error;
      }

      setMessage(
        "École ajoutée avec succès."
      );

      setSchoolName("");
      setSchoolAddress("");
      setSchoolCity("Dakar");
      setSchoolPhone("");
      setSchoolEmail("");
      setShowSchoolForm(false);

      await loadAllData();

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur : " + error.message
      );
    } finally {
      setSavingSchool(false);
    }
  }

  /* =========================
     CLASSES
  ========================= */

  async function createClass() {
    setMessage("");

    if (!className.trim()) {
      setMessage(
        "Le nom de la classe est obligatoire."
      );
      return;
    }

    if (!selectedSchoolId) {
      setMessage(
        "Veuillez choisir une école."
      );
      return;
    }

    setSavingClass(true);

    try {
      const {
        error
      } = await supabase
        .from("classes")
        .insert({
          school_id:
            selectedSchoolId,
          name:
            className.trim(),
          level:
            classLevel.trim() || null
        });

      if (error) {
        throw error;
      }

      setMessage(
        "Classe ajoutée avec succès."
      );

      setClassName("");
      setClassLevel("");
      setSelectedSchoolId("");
      setShowClassForm(false);

      await loadAllData();

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur : " + error.message
      );
    } finally {
      setSavingClass(false);
    }
  }

  /* =========================
     MATIÈRES
  ========================= */

  async function createSubject() {
    setMessage("");

    if (!subjectName.trim()) {
      setMessage(
        "Le nom de la matière est obligatoire."
      );
      return;
    }

    setSavingSubject(true);

    try {
      const {
        error
      } = await supabase
        .from("subjects")
        .insert({
          name:
            subjectName.trim()
        });

      if (error) {
        throw error;
      }

      setMessage(
        "Matière ajoutée avec succès."
      );

      setSubjectName("");
      setShowSubjectForm(false);

      await loadAllData();

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur : " + error.message
      );
    } finally {
      setSavingSubject(false);
    }
  }

  /* =========================
     ÉLÈVES
  ========================= */

  async function createStudent() {
    setMessage("");

    if (!studentFirstName.trim()) {
      setMessage(
        "Le prénom est obligatoire."
      );
      return;
    }

    if (!studentLastName.trim()) {
      setMessage(
        "Le nom est obligatoire."
      );
      return;
    }

    if (!studentSchoolId) {
      setMessage(
        "Veuillez choisir une école."
      );
      return;
    }

    setSavingStudent(true);

    try {
      const {
        error
      } = await supabase
        .from("students")
        .insert({
          school_id:
            studentSchoolId,

          class_id:
            studentClassId || null,

          first_name:
            studentFirstName.trim(),

          last_name:
            studentLastName.trim(),

          student_code:
            studentCode.trim() || null,

          active:
            true
        });

      if (error) {
        throw error;
      }

      setMessage(
        "Élève ajouté avec succès."
      );

      setStudentFirstName("");
      setStudentLastName("");
      setStudentCode("");
      setStudentSchoolId("");
      setStudentClassId("");
      setShowStudentForm(false);

      await loadAllData();

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur : " + error.message
      );
    } finally {
      setSavingStudent(false);
    }
  }

  /* =========================
     ACTIVER / DÉSACTIVER ÉLÈVE
  ========================= */

  async function toggleStudent(student) {
    try {
      const {
        error
      } = await supabase
        .from("students")
        .update({
          active:
            student.active === false
        })
        .eq("id", student.id);

      if (error) {
        throw error;
      }

      setMessage(
        student.active === false
          ? "Élève activé."
          : "Élève désactivé."
      );

      await loadAllData();

    } catch (error) {
      setMessage(
        "Erreur : " + error.message
      );
    }
  }

  /* =========================
     ACTIVER / DÉSACTIVER PROF
     
     Remarque :
     profiles ne possède pas de
     colonne active dans notre
     structure connue.

     On utilise donc le rôle :
     teacher = actif
     suspended = désactivé
  ========================= */

  async function toggleTeacher(teacher) {
    const newRole =
      teacher.role === "teacher"
        ? "suspended"
        : "teacher";

    try {
      const {
        error
      } = await supabase
        .from("profiles")
        .update({
          role: newRole
        })
        .eq("id", teacher.id);

      if (error) {
        throw error;
      }

      setMessage(
        newRole === "teacher"
          ? "Professeur réactivé."
          : "Professeur désactivé."
      );

      await loadAllData();

    } catch (error) {
      setMessage(
        "Erreur : " + error.message
      );
    }
  }

  /* =========================
     SUPPRESSION D'UN DOCUMENT
  ========================= */

  async function deleteDocument(documentId) {
    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer ce document ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error
      } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) {
        throw error;
      }

      setMessage(
        "Document supprimé."
      );

      await loadAllData();

    } catch (error) {
      setMessage(
        "Erreur : " + error.message
      );
    }
  }

  /* =========================
     SUPPRESSION D'UN EXERCICE
  ========================= */

  async function deleteExercise(exerciseId) {
    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer cet exercice ?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error
      } = await supabase
        .from("exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) {
        throw error;
      }

      setMessage(
        "Exercice supprimé."
      );

      await loadAllData();

    } catch (error) {
      setMessage(
        "Erreur : " + error.message
      );
    }
  }

  /* =========================
     ÉCOLE PAR ID
  ========================= */

  function getSchoolName(schoolId) {
    const school =
      schools.find(
        (item) =>
          item.id === schoolId
      );

    return school?.name ||
      "École non définie";
  }

  /* =========================
     CLASSE PAR ID
  ========================= */

  function getClassName(classId) {
    const item =
      classes.find(
        (item) =>
          item.id === classId
      );

    return item?.name ||
      "Classe non définie";
  }

  /* =========================
     MATIÈRE PAR ID
  ========================= */

  function getSubjectName(subjectId) {
    const item =
      subjects.find(
        (item) =>
          Number(item.id) ===
          Number(subjectId)
      );

    return item?.name ||
      "Matière non définie";
  }

  /* =========================
     CHARGEMENT
  ========================= */

  if (loading) {
    return (
      <div className="center">
        Chargement du tableau
        de bord administrateur…
      </div>
    );
  }

  /* =========================
     INTERFACE
  ========================= */

  return (
    <main className="page">
      <section className="card dashboard">

        {/* HEADER */}

        <div className="top">

          <div>
            <p className="eyebrow">
              ÉCOLE CONNECTÉE
            </p>

            <h1>
              Administration 👑
            </h1>

            <p>
              {session?.user?.email}
            </p>
          </div>

          <button
            className="secondary"
            onClick={onLogout}
          >
            Déconnexion
          </button>

        </div>

        {/* MESSAGE */}

        {message && (
          <div className="notice">
            <p className="message">
              {message}
            </p>
          </div>
        )}

        {/* STATISTIQUES */}

        <div className="grid">

          <div className="stat">
            <strong>
              {schools.length}
            </strong>
            <span>
              🏫 Écoles
            </span>
          </div>

          <div className="stat">
            <strong>
              {teachers.length}
            </strong>
            <span>
              👨‍🏫 Professeurs
            </span>
          </div>

          <div className="stat">
            <strong>
              {students.length}
            </strong>
            <span>
              👨‍🎓 Élèves
            </span>
          </div>

          <div className="stat">
            <strong>
              {classes.length}
            </strong>
            <span>
              🏷️ Classes
            </span>
          </div>

          <div className="stat">
            <strong>
              {subjects.length}
            </strong>
            <span>
              📚 Matières
            </span>
          </div>

          <div className="stat">
            <strong>
              {documents.length}
            </strong>
            <span>
              📖 Documents
            </span>
          </div>

          <div className="stat">
            <strong>
              {exercises.length}
            </strong>
            <span>
              📝 Exercices
            </span>
          </div>

          <div className="stat">
            <strong>
              {questions.length}
            </strong>
            <span>
              ❓ Questions
            </span>
          </div>

        </div>

        {/* MENU ADMIN */}

        <div className="notice">

          <h2>
            👑 Centre de contrôle
          </h2>

          <div className="grid">

            <button
              onClick={() =>
                setActiveSection("overview")
              }
            >
              📊 Vue générale
            </button>

            <button
              onClick={() =>
                setActiveSection("schools")
              }
            >
              🏫 Écoles
            </button>

            <button
              onClick={() =>
                setActiveSection("teachers")
              }
            >
              👨‍🏫 Professeurs
            </button>

            <button
              onClick={() =>
                setActiveSection("students")
              }
            >
              👨‍🎓 Élèves
            </button>

            <button
              onClick={() =>
                setActiveSection("classes")
              }
            >
              🏷️ Classes
            </button>

            <button
              onClick={() =>
                setActiveSection("subjects")
              }
            >
              📚 Matières
            </button>

            <button
              onClick={() =>
                setActiveSection("documents")
              }
            >
              📖 Documents
            </button>

            <button
              onClick={() =>
                setActiveSection("exercises")
              }
            >
              📝 Exercices
            </button>

            <button
              onClick={() =>
                setActiveSection("attendance")
              }
            >
              📊 Présences
            </button>

            <button
              onClick={() =>
                setActiveSection("notifications")
              }
            >
              🔔 Notifications
            </button>

          </div>

        </div>

        {/* =====================
            VUE GÉNÉRALE
        ===================== */}

        {activeSection === "overview" && (
          <div className="notice">

            <h2>
              📊 Vue générale
            </h2>

            <p>
              L'administrateur possède
              une vue globale de la
              plateforme.
            </p>

            <p>
              👨‍🏫 {teachers.length} professeurs
            </p>

            <p>
              👨‍🎓 {students.length} élèves
            </p>

            <p>
              🏫 {schools.length} écoles
            </p>

            <p>
              📚 {subjects.length} matières
            </p>

            <p>
              📝 {exercises.length} exercices
            </p>

            <p>
              📖 {documents.length} documents
            </p>

            <p>
              📊 {attendance.length} enregistrements
              de présence
            </p>

            <p>
              🔔 {notifications.length} notifications
            </p>

          </div>
        )}

        {/* =====================
            ÉCOLES
        ===================== */}

        {activeSection === "schools" && (
          <div className="notice">

            <h2>
              🏫 Gestion des écoles
            </h2>

            <button
              onClick={() =>
                setShowSchoolForm(
                  !showSchoolForm
                )
              }
            >
              {showSchoolForm
                ? "Fermer"
                : "+ Ajouter une école"}
            </button>

            {showSchoolForm && (
              <div className="card">

                <h3>
                  Nouvelle école
                </h3>

                <label>
                  Nom
                </label>

                <input
                  value={schoolName}
                  onChange={(e) =>
                    setSchoolName(
                      e.target.value
                    )
                  }
                  placeholder="Nom de l'école"
                />

                <label>
                  Adresse
                </label>

                <input
                  value={schoolAddress}
                  onChange={(e) =>
                    setSchoolAddress(
                      e.target.value
                    )
                  }
                  placeholder="Adresse"
                />

                <label>
                  Ville
                </label>

                <input
                  value={schoolCity}
                  onChange={(e) =>
                    setSchoolCity(
                      e.target.value
                    )
                  }
                  placeholder="Dakar"
                />

                <label>
                  Téléphone
                </label>

                <input
                  value={schoolPhone}
                  onChange={(e) =>
                    setSchoolPhone(
                      e.target.value
                    )
                  }
                  placeholder="Téléphone"
                />

                <label>
                  E-mail
                </label>

                <input
                  type="email"
                  value={schoolEmail}
                  onChange={(e) =>
                    setSchoolEmail(
                      e.target.value
                    )
                  }
                  placeholder="E-mail"
                />

                <button
                  onClick={createSchool}
                  disabled={savingSchool}
                >
                  {savingSchool
                    ? "Enregistrement..."
                    : "💾 Enregistrer"}
                </button>

              </div>
            )}

            <h3>
              Écoles enregistrées
            </h3>

            {schools.length === 0 ? (
              <p>
                Aucune école.
              </p>
            ) : (
              schools.map((school) => (
                <div
                  className="stat"
                  key={school.id}
                >
                  <strong>
                    {school.name}
                  </strong>

                  <span>
                    {school.city || ""}
                    {" • "}
                    {school.phone || "Sans téléphone"}
                  </span>
                </div>
              ))
            )}

          </div>
        )}

        {/* =====================
            PROFESSEURS
        ===================== */}

        {activeSection === "teachers" && (
          <div className="notice">

            <h2>
              👨‍🏫 Gestion des professeurs
            </h2>

            <p>
              {teachers.length} professeur(s)
              enregistré(s).
            </p>

            {teachers.map((teacher) => (
              <div
                className="stat"
                key={teacher.id}
              >

                <strong>
                  {teacher.full_name}
                </strong>

                <span>
                  {teacher.phone || "Téléphone non renseigné"}
                  {" • "}
                  {getSchoolName(
                    teacher.school_id
                  )}
                  {" • "}
                  {teacher.role === "teacher"
                    ? "Actif"
                    : "Désactivé"}
                </span>

                <button
                  onClick={() =>
                    toggleTeacher(
                      teacher
                    )
                  }
                >
                  {teacher.role === "teacher"
                    ? "Désactiver"
                    : "Réactiver"}
                </button>

              </div>
            ))}

          </div>
        )}

        {/* =====================
            ÉLÈVES
        ===================== */}

        {activeSection === "students" && (
          <div className="notice">

            <h2>
              👨‍🎓 Gestion des élèves
            </h2>

            <button
              onClick={() =>
                setShowStudentForm(
                  !showStudentForm
                )
              }
            >
              {showStudentForm
                ? "Fermer"
                : "+ Nouvel élève"}
            </button>

            {showStudentForm && (
              <div className="card">

                <h3>
                  Nouvel élève
                </h3>

                <label>
                  Prénom
                </label>

                <input
                  value={studentFirstName}
                  onChange={(e) =>
                    setStudentFirstName(
                      e.target.value
                    )
                  }
                />

                <label>
                  Nom
                </label>

                <input
                  value={studentLastName}
                  onChange={(e) =>
                    setStudentLastName(
                      e.target.value
                    )
                  }
                />

                <label>
                  Code élève
                </label>

                <input
                  value={studentCode}
                  onChange={(e) =>
                    setStudentCode(
                      e.target.value
                    )
                  }
                  placeholder="Ex : EC-001"
                />

                <label>
                  École
                </label>

                <select
                  value={studentSchoolId}
                  onChange={(e) => {
                    setStudentSchoolId(
                      e.target.value
                    );
                    setStudentClassId("");
                  }}
                >
                  <option value="">
                    Choisir une école
                  </option>

                  {schools.map((school) => (
                    <option
                      key={school.id}
                      value={school.id}
                    >
                      {school.name}
                    </option>
                  ))}
                </select>

                <label>
                  Classe
                </label>

                <select
                  value={studentClassId}
                  onChange={(e) =>
                    setStudentClassId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Choisir une classe
                  </option>

                  {classes
                    .filter(
                      (item) =>
                        !studentSchoolId ||
                        item.school_id ===
                          studentSchoolId
                    )
                    .map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    ))}
                </select>

                <button
                  onClick={createStudent}
                  disabled={savingStudent}
                >
                  {savingStudent
                    ? "Enregistrement..."
                    : "💾 Enregistrer l'élève"}
                </button>

              </div>
            )}

            <h3>
              Élèves enregistrés
            </h3>

            {students.length === 0 ? (
              <p>
                Aucun élève.
              </p>
            ) : (
              students.map((student) => (
                <div
                  className="stat"
                  key={student.id}
                >

                  <strong>
                    {student.first_name}{" "}
                    {student.last_name}
                  </strong>

                  <span>
                    {getSchoolName(
                      student.school_id
                    )}
                    {" • "}
                    {getClassName(
                      student.class_id
                    )}
                    {" • "}
                    {student.active === false
                      ? "Désactivé"
                      : "Actif"}
                  </span>

                  <button
                    onClick={() =>
                      toggleStudent(
                        student
                      )
                    }
                  >
                    {student.active === false
                      ? "Réactiver"
                      : "Désactiver"}
                  </button>

                </div>
              ))
            )}

          </div>
        )}

        {/* =====================
            CLASSES
        ===================== */}

        {activeSection === "classes" && (
          <div className="notice">

            <h2>
              🏷️ Gestion des classes
            </h2>

            <button
              onClick={() =>
                setShowClassForm(
                  !showClassForm
                )
              }
            >
              {showClassForm
                ? "Fermer"
                : "+ Ajouter une classe"}
            </button>

            {showClassForm && (
              <div className="card">

                <h3>
                  Nouvelle classe
                </h3>

                <label>
                  École
                </label>

                <select
                  value={selectedSchoolId}
                  onChange={(e) =>
                    setSelectedSchoolId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Choisir une école
                  </option>

                  {schools.map((school) => (
                    <option
                      key={school.id}
                      value={school.id}
                    >
                      {school.name}
                    </option>
                  ))}
                </select>

                <label>
                  Nom de la classe
                </label>

                <input
                  value={className}
                  onChange={(e) =>
                    setClassName(
                      e.target.value
                    )
                  }
                  placeholder="Ex : 4ème A"
                />

                <label>
                  Niveau
                </label>

                <input
                  value={classLevel}
                  onChange={(e) =>
                    setClassLevel(
                      e.target.value
                    )
                  }
                  placeholder="Ex : Collège"
                />

                <button
                  onClick={createClass}
                  disabled={savingClass}
                >
                  {savingClass
                    ? "Enregistrement..."
                    : "💾 Enregistrer"}
                </button>

              </div>
            )}

            {classes.map((item) => (
              <div
                className="stat"
                key={item.id}
              >
                <strong>
                  {item.name}
                </strong>

                <span>
                  {item.level || ""}
                  {" • "}
                  {getSchoolName(
                    item.school_id
                  )}
                </span>
              </div>
            ))}

          </div>
        )}

        {/* =====================
            MATIÈRES
        ===================== */}

        {activeSection === "subjects" && (
          <div className="notice">

            <h2>
              📚 Gestion des matières
            </h2>

            <button
              onClick={() =>
                setShowSubjectForm(
                  !showSubjectForm
                )
              }
            >
              {showSubjectForm
                ? "Fermer"
                : "+ Ajouter une matière"}
            </button>

            {showSubjectForm && (
              <div className="card">

                <h3>
                  Nouvelle matière
                </h3>

                <label>
                  Nom
                </label>

                <input
                  value={subjectName}
                  onChange={(e) =>
                    setSubjectName(
                      e.target.value
                    )
                  }
                  placeholder="Ex : Mathématiques"
                />

                <button
                  onClick={createSubject}
                  disabled={savingSubject}
                >
                  {savingSubject
                    ? "Enregistrement..."
                    : "💾 Enregistrer"}
                </button>

              </div>
            )}

            {subjects.map((subject) => (
              <div
                className="stat"
                key={subject.id}
              >
                <strong>
                  {subject.name}
                </strong>

                <span>
                  ID : {subject.id}
                </span>
              </div>
            ))}

          </div>
        )}

        {/* =====================
            DOCUMENTS
        ===================== */}

        {activeSection === "documents" && (
          <div className="notice">

            <h2>
              📖 Tous les documents
            </h2>

            <p>
              Leçons, cours, exercices,
              devoirs et interrogations
              publiés par les professeurs.
            </p>

            {documents.length === 0 ? (
              <p>
                Aucun document.
              </p>
            ) : (
              documents.map((document) => (
                <div
                  className="stat"
                  key={document.id}
                >

                  <strong>
                    {document.title}
                  </strong>

                  <span>
                    {document.document_type}
                    {" • "}
                    {getClassName(
                      document.class_id
                    )}
                    {" • "}
                    {getSubjectName(
                      document.subject_id
                    )}
                  </span>

                  <button
                    onClick={() =>
                      window.open(
                        document.file_url,
                        "_blank"
                      )
                    }
                  >
                    📄 Ouvrir
                  </button>

                  <button
                    className="secondary"
                    onClick={() =>
                      deleteDocument(
                        document.id
                      )
                    }
                  >
                    🗑️ Supprimer
                  </button>

                </div>
              ))
            )}

          </div>
        )}

        {/* =====================
            EXERCICES
        ===================== */}

        {activeSection === "exercises" && (
          <div className="notice">

            <h2>
              📝 Tous les exercices
            </h2>

            <p>
              L'administrateur peut
              consulter tous les exercices
              créés par les professeurs.
            </p>

            {exercises.length === 0 ? (
              <p>
                Aucun exercice.
              </p>
            ) : (
              exercises.map((exercise) => (
                <div
                  className="stat"
                  key={exercise.id}
                >

                  <strong>
                    {exercise.title}
                  </strong>

                  <span>
                    {getClassName(
                      exercise.class_id
                    )}
                    {" • "}
                    {getSubjectName(
                      exercise.subject_id
                    )}
                    {" • "}
                    {exercise.duration_minutes}
                    {" min"}
                    {" • "}
                    {exercise.published
                      ? "Publié"
                      : "Brouillon"}
                  </span>

                  <p>
                    {exercise.description}
                  </p>

                  <p>
                    <strong>
                      Consignes :
                    </strong>{" "}
                    {exercise.instructions}
                  </p>

                  <button
                    className="secondary"
                    onClick={() =>
                      deleteExercise(
                        exercise.id
                      )
                    }
                  >
                    🗑️ Supprimer
                  </button>

                </div>
              ))
            )}

          </div>
        )}

        {/* =====================
            PRÉSENCES
        ===================== */}

        {activeSection === "attendance" && (
          <div className="notice">

            <h2>
              📊 Présences
            </h2>

            <p>
              Vue globale des présences
              enregistrées dans l'application.
            </p>

            {attendance.length === 0 ? (
              <p>
                Aucun enregistrement.
              </p>
            ) : (
              attendance
                .slice(0, 100)
                .map((item) => (
                  <div
                    className="stat"
                    key={item.id}
                  >

                    <strong>
                      Élève :{" "}
                      {item.student_id}
                    </strong>

                    <span>
                      Date : {item.date}
                      {" • "}
                      Statut : {item.status}
                    </span>

                    <span>
                      Arrivée :{" "}
                      {item.arrival_time || "-"}
                      {" • "}
                      Départ :{" "}
                      {item.departure_time || "-"}
                    </span>

                  </div>
                ))
            )}

          </div>
        )}

        {/* =====================
            NOTIFICATIONS
        ===================== */}

        {activeSection === "notifications" && (
          <div className="notice">

            <h2>
              🔔 Notifications
            </h2>

            {notifications.length === 0 ? (
              <p>
                Aucune notification.
              </p>
            ) : (
              notifications
                .slice(0, 100)
                .map((item) => (
                  <div
                    className="stat"
                    key={item.id}
                  >

                    <strong>
                      {item.title}
                    </strong>

                    <span>
                      {item.type}
                      {" • "}
                      {item.read
                        ? "Lue"
                        : "Non lue"}
                    </span>

                    <p>
                      {item.message}
                    </p>

                  </div>
                ))
            )}

          </div>
        )}

      </section>
    </main>
  );
}
