import React, { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function AdminDashboard({ session, onLogout }) {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    parents: 0,
    schools: 0,
    classes: 0,
    subjects: 0,
  });

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [creatingTeacher, setCreatingTeacher] =
    useState(false);

  const [savingTeacher, setSavingTeacher] =
    useState(false);

  const [creatingStudent, setCreatingStudent] =
    useState(false);

  const [savingStudent, setSavingStudent] =
    useState(false);

  const [showTeacherForm, setShowTeacherForm] =
    useState(false);

  const [showStudentForm, setShowStudentForm] =
    useState(false);

  const [editingTeacher, setEditingTeacher] =
    useState(null);

  const [editingStudent, setEditingStudent] =
    useState(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  /* =========================
     PROFESSEUR
  ========================== */

  const [teacherName, setTeacherName] =
    useState("");

  const [teacherEmail, setTeacherEmail] =
    useState("");

  const [teacherPhone, setTeacherPhone] =
    useState("");

  /* =========================
     ÉLÈVE
  ========================== */

  const [studentFirstName, setStudentFirstName] =
    useState("");

  const [studentLastName, setStudentLastName] =
    useState("");

  const [studentSchoolId, setStudentSchoolId] =
    useState("");

  const [studentClassId, setStudentClassId] =
    useState("");

  const [studentCode, setStudentCode] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     CHARGEMENT DES DONNÉES
  ========================== */

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const teachersResponse =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, phone, role, is_active"
          )
          .eq("role", "teacher")
          .order("full_name");

      if (teachersResponse.error) {
        throw teachersResponse.error;
      }

      const studentsResponse =
        await supabase
          .from("students")
          .select(
            "id, school_id, class_id, first_name, last_name, student_code, photo_url, active, created_at"
          )
          .order("created_at", {
            ascending: false,
          });

      if (studentsResponse.error) {
        throw studentsResponse.error;
      }

      const schoolsResponse =
        await supabase
          .from("schools")
          .select("id, name")
          .order("name");

      if (schoolsResponse.error) {
        throw schoolsResponse.error;
      }

      const classesResponse =
        await supabase
          .from("classes")
          .select(
            "id, school_id, name, level"
          )
          .order("name");

      if (classesResponse.error) {
        throw classesResponse.error;
      }

      const parentsResponse =
        await supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "parent");

      if (parentsResponse.error) {
        throw parentsResponse.error;
      }

      const subjectsResponse =
        await supabase
          .from("subjects")
          .select("id", {
            count: "exact",
            head: true,
          });

      if (subjectsResponse.error) {
        throw subjectsResponse.error;
      }

      const teacherList =
        teachersResponse.data || [];

      const studentList =
        studentsResponse.data || [];

      const schoolList =
        schoolsResponse.data || [];

      const classList =
        classesResponse.data || [];

      setTeachers(teacherList);
      setStudents(studentList);
      setSchools(schoolList);
      setClasses(classList);

      setStats({
        teachers: teacherList.length,
        students: studentList.length,
        parents:
          parentsResponse.count || 0,
        schools: schoolList.length,
        classes: classList.length,
        subjects:
          subjectsResponse.count || 0,
      });
    } catch (error) {
      console.error(
        "Erreur chargement administration:",
        error
      );

      setErrorMessage(
        error.message ||
          "Impossible de charger les données."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     CRÉER PROFESSEUR
  ========================== */

  async function createTeacher() {
    setMessage("");
    setErrorMessage("");

    const cleanName =
      teacherName.trim();

    const cleanEmail =
      teacherEmail
        .trim()
        .toLowerCase();

    const cleanPhone =
      teacherPhone.trim();

    if (!cleanName) {
      setErrorMessage(
        "Veuillez saisir le nom complet du professeur."
      );
      return;
    }

    if (
      !cleanEmail ||
      !cleanEmail.includes("@")
    ) {
      setErrorMessage(
        "Veuillez saisir une adresse e-mail valide."
      );
      return;
    }

    setCreatingTeacher(true);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "create-user",
          {
            body: {
              full_name: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              role: "teacher",
            },
          }
        );

      if (error) {
        throw new Error(
          error.message ||
            "Impossible de contacter le serveur."
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "La création du professeur a échoué."
        );
      }

      setMessage(
        "Professeur créé avec succès."
      );

      setTeacherName("");
      setTeacherEmail("");
      setTeacherPhone("");

      setShowTeacherForm(false);

      await loadData();
    } catch (error) {
      console.error(
        "Erreur création professeur:",
        error
      );

      setErrorMessage(
        error.message ||
          "Impossible de créer le professeur."
      );
    } finally {
      setCreatingTeacher(false);
    }
  }

  /* =========================
     MODIFIER PROFESSEUR
  ========================== */

  function startEditTeacher(teacher) {
    setMessage("");
    setErrorMessage("");

    setEditingTeacher(teacher);

    setTeacherName(
      teacher.full_name || ""
    );

    setTeacherPhone(
      teacher.phone || ""
    );
  }

  function cancelEditTeacher() {
    setEditingTeacher(null);
    setTeacherName("");
    setTeacherPhone("");
  }

  async function saveTeacher() {
    if (!editingTeacher) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    const cleanName =
      teacherName.trim();

    const cleanPhone =
      teacherPhone.trim();

    if (!cleanName) {
      setErrorMessage(
        "Le nom complet est obligatoire."
      );
      return;
    }

    setSavingTeacher(true);

    try {
      const { error } =
        await supabase
          .from("profiles")
          .update({
            full_name: cleanName,
            phone:
              cleanPhone || null,
          })
          .eq(
            "id",
            editingTeacher.id
          )
          .eq("role", "teacher");

      if (error) {
        throw error;
      }

      setMessage(
        "Professeur modifié avec succès."
      );

      cancelEditTeacher();

      await loadData();
    } catch (error) {
      console.error(
        "Erreur modification professeur:",
        error
      );

      setErrorMessage(
        error.message ||
          "Impossible de modifier le professeur."
      );
    } finally {
      setSavingTeacher(false);
    }
  }

  /* =========================
     ACTIVER / DÉSACTIVER PROF
  ========================== */

  async function toggleTeacherStatus(
    teacher
  ) {
    setMessage("");
    setErrorMessage("");

    const newStatus =
      !teacher.is_active;

    const confirmation =
      window.confirm(
        newStatus
          ? `Voulez-vous réactiver ${
              teacher.full_name ||
              "ce professeur"
            } ?`
          : `Voulez-vous désactiver ${
              teacher.full_name ||
              "ce professeur"
            } ?`
      );

    if (!confirmation) {
      return;
    }

    try {
      const { error } =
        await supabase
          .from("profiles")
          .update({
            is_active: newStatus,
          })
          .eq(
            "id",
            teacher.id
          )
          .eq("role", "teacher");

      if (error) {
        throw error;
      }

      setMessage(
        newStatus
          ? "Professeur réactivé avec succès."
          : "Professeur désactivé avec succès."
      );

      await loadData();
    } catch (error) {
      console.error(
        "Erreur statut professeur:",
        error
      );

      setErrorMessage(
        error.message ||
          "Impossible de modifier le statut."
      );
    }
  }

  /* =========================
     CRÉER ÉLÈVE
  ========================== */

  async function createStudent() {
    setMessage("");
    setErrorMessage("");

    const firstName =
      studentFirstName.trim();

    const lastName =
      studentLastName.trim();

    if (!firstName) {
      setErrorMessage(
        "Le prénom de l'élève est obligatoire."
      );
      return;
    }

    if (!lastName) {
      setErrorMessage(
        "Le nom de l'élève est obligatoire."
      );
      return;
    }

    if (!studentSchoolId) {
      setErrorMessage(
        "Veuillez sélectionner une école."
      );
      return;
    }

    if (!studentClassId) {
      setErrorMessage(
        "Veuillez sélectionner une classe."
      );
      return;
    }

    setCreatingStudent(true);

    try {
      const { error } =
        await supabase
          .from("students")
          .insert({
            first_name: firstName,
            last_name: lastName,
            school_id:
              studentSchoolId,
            class_id:
              studentClassId,
            student_code:
              studentCode.trim() ||
              null,
            active: true,
          });

      if (error) {
        throw error;
      }

      setMessage(
        "Élève créé avec succès."
      );

      setStudentFirstName("");
      setStudentLastName("");
      setStudentSchoolId("");
      setStudentClassId("");
      setStudentCode("");

      setShowStudentForm(false);

      await loadData();
    } catch (error) {
      console.error(
        "Erreur création élève:",
        error
      );

      setErrorMessage(
        error.message ||
          "Impossible de créer l'élève."
      );
    } finally {
      setCreatingStudent(false);
    }
  }

  /* =========================
     MODIFIER ÉLÈVE
  ========================== */

  function startEditStudent(student) {
    setMessage("");
    setErrorMessage("");

    setEditingStudent(student);

    setStudentFirstName(
      student.first_name || ""
    );

    setStudentLastName(
      student.last_name || ""
    );

    setStudentSchoolId(
      student.school_id || ""
    );

    setStudentClassId(
      student.class_id || ""
    );

    setStudentCode(
      student.student_code || ""
    );
  }

  function cancelEditStudent() {
    setEditingStudent(null);

    setStudentFirstName("");
    setStudentLastName("");
    setStudentSchoolId("");
    setStudentClassId("");
    setStudentCode("");
  }

  async function saveStudent() {
    if (!editingStudent) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    const firstName =
      studentFirstName.trim();

    const lastName =
      studentLastName.trim();

    if (!firstName) {
      setErrorMessage(
        "Le prénom est obligatoire."
      );
      return;
    }

    if (!lastName) {
      setErrorMessage(
        "Le nom est obligatoire."
      );
      return;
    }

    if (!studentSchoolId) {
      setErrorMessage(
        "Veuillez sélectionner une école."
      );
      return;
    }

    if (!studentClassId) {
      setErrorMessage(
        "Veuillez sélectionner une classe."
      );
      return;
    }

    setSavingStudent(true);

    try {
      const { error } =
        await supabase
          .from("students")
          .update({
            first_name: firstName,
            last_name: lastName,
            school_id:
              studentSchoolId,
            class_id:
              studentClassId,
            student_code:
              studentCode.trim() ||
              null,
          })
          .eq(
            "id",
            editingStudent.id
          );

      if (error) {
        throw error;
      }

      setMessage(
        "Élève modifié avec succès."
      );

      cancelEditStudent();

      await loadData();
    } catch (error) {
      console.error(
        "Erreur modification élève:",
        error
      );

      setErrorMessage(
        error.message ||
          "Impossible de modifier l'élève."
      );
    } finally {
      setSavingStudent(false);
    }
  }

  /* =========================
     ACTIVER / DÉSACTIVER ÉLÈVE
  ========================== */

  async function toggleStudentStatus(
    student
  ) {
    setMessage("");
    setErrorMessage("");

    const currentStatus =
      student.active !== false;

    const newStatus =
      !currentStatus;

    const studentName =
      `${student.first_name || ""} ${
        student.last_name || ""
      }`.trim();

    const confirmation =
      window.confirm(
        newStatus
          ? `Voulez-vous réactiver ${
              studentName ||
              "cet élève"
            } ?`
          : `Voulez-vous désactiver ${
              studentName ||
              "cet élève"
            } ?`
      );

    if (!confirmation) {
      return;
    }

    try {
      const { error } =
        await supabase
          .from("students")
          .update({
            active: newStatus,
          })
          .eq(
            "id",
            student.id
          );

      if (error) {
        throw error;
      }

      setMessage(
        newStatus
          ? "Élève réactivé avec succès."
          : "Élève désactivé avec succès."
      );

      await loadData();
    } catch (error) {
      console.error(
        "Erreur statut élève:",
        error
      );

      setErrorMessage(
        error.message ||
          "Impossible de modifier le statut de l'élève."
      );
    }
  }

  /* =========================
     NOM ÉCOLE
  ========================== */

  function getSchoolName(schoolId) {
    const school =
      schools.find(
        (item) =>
          item.id === schoolId
      );

    return (
      school?.name ||
      "École non définie"
    );
  }

  /* =========================
     NOM CLASSE
  ========================== */

  function getClassName(classId) {
    const item =
      classes.find(
        (classItem) =>
          classItem.id === classId
      );

    if (!item) {
      return "Classe non définie";
    }

    return `${item.name || ""}${
      item.level
        ? ` - ${item.level}`
        : ""
    }`;
  }

  /* =========================
     FILTRER LES CLASSES
  ========================== */

  const availableClasses =
    studentSchoolId
      ? classes.filter(
          (item) =>
            item.school_id ===
            studentSchoolId
        )
      : [];

  /* =========================
     CHARGEMENT
  ========================== */

  if (loading) {
    return (
      <div className="center">
        Chargement de l'administration…
      </div>
    );
  }

  /* =========================
     INTERFACE
  ========================== */

  return (
    <main className="page">
      <section className="card dashboard">

        {/* EN-TÊTE */}

        <div className="top">
          <div>
            <p className="eyebrow">
              ÉCOLE CONNECTÉE
            </p>

            <h1>
              Administration 🛠️
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

        {/* MESSAGES */}

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="message">
            {errorMessage}
          </p>
        )}

        {/* STATISTIQUES */}

        <div className="grid">

          <div className="stat">
            <strong>
              {stats.teachers}
            </strong>
            <span>
              Professeurs
            </span>
          </div>

          <div className="stat">
            <strong>
              {stats.students}
            </strong>
            <span>
              Élèves
            </span>
          </div>

          <div className="stat">
            <strong>
              {stats.parents}
            </strong>
            <span>
              Parents
            </span>
          </div>

          <div className="stat">
            <strong>
              {stats.schools}
            </strong>
            <span>
              Écoles
            </span>
          </div>

          <div className="stat">
            <strong>
              {stats.classes}
            </strong>
            <span>
              Classes
            </span>
          </div>

          <div className="stat">
            <strong>
              {stats.subjects}
            </strong>
            <span>
              Matières
            </span>
          </div>

        </div>

        {/* GESTION */}

        <div className="notice">

          <h2>
            Gestion de l'école
          </h2>

          <p>
            L'administrateur peut gérer
            les professeurs, élèves,
            parents, écoles, classes
            et matières.
          </p>

        </div>

        {/* =========================
            PROFESSEURS
        ========================== */}

        <div className="notice">

          <div className="top">

            <div>
              <h2>
                👨‍🏫 Professeurs
              </h2>

              <p>
                {teachers.length} professeur
                {teachers.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>

            <button
              onClick={() => {
                setShowTeacherForm(
                  !showTeacherForm
                );

                setEditingTeacher(null);
              }}
            >
              {showTeacherForm
                ? "Fermer"
                : "+ Nouveau professeur"}
            </button>

          </div>

          {/* FORMULAIRE PROF */}

          {showTeacherForm && (
            <div className="card">

              <h2>
                Nouveau professeur
              </h2>

              <p>
                Renseignez les informations
                du professeur.
              </p>

              <label>
                Nom complet
              </label>

              <input
                type="text"
                placeholder="Ex : Mamadou Diop"
                value={teacherName}
                onChange={(e) =>
                  setTeacherName(
                    e.target.value
                  )
                }
                disabled={
                  creatingTeacher
                }
              />

              <label>
                Adresse e-mail
              </label>

              <input
                type="email"
                placeholder="professeur@email.com"
                value={teacherEmail}
                onChange={(e) =>
                  setTeacherEmail(
                    e.target.value
                  )
                }
                disabled={
                  creatingTeacher
                }
              />

              <label>
                Téléphone
              </label>

              <input
                type="tel"
                placeholder="Ex : 77 000 00 00"
                value={teacherPhone}
                onChange={(e) =>
                  setTeacherPhone(
                    e.target.value
                  )
                }
                disabled={
                  creatingTeacher
                }
              />

              <button
                onClick={createTeacher}
                disabled={
                  creatingTeacher
                }
              >
                {creatingTeacher
                  ? "Création..."
                  : "👨‍🏫 Créer le professeur"}
              </button>

            </div>
          )}

          {/* MODIFICATION PROF */}

          {editingTeacher && (
            <div className="card">

              <h2>
                ✏️ Modifier le professeur
              </h2>

              <label>
                Nom complet
              </label>

              <input
                type="text"
                value={teacherName}
                onChange={(e) =>
                  setTeacherName(
                    e.target.value
                  )
                }
              />

              <label>
                Téléphone
              </label>

              <input
                type="tel"
                value={teacherPhone}
                onChange={(e) =>
                  setTeacherPhone(
                    e.target.value
                  )
                }
              />

              <button
                onClick={saveTeacher}
                disabled={
                  savingTeacher
                }
              >
                {savingTeacher
                  ? "Enregistrement..."
                  : "💾 Enregistrer"}
              </button>

              <button
                className="secondary"
                onClick={
                  cancelEditTeacher
                }
              >
                Annuler
              </button>

            </div>
          )}

          {/* LISTE PROF */}

          <div
            style={{
              marginTop: "20px",
            }}
          >

            {teachers.map(
              (teacher) => (

                <div
                  key={teacher.id}
                  className="stat"
                  style={{
                    marginBottom:
                      "15px",
                  }}
                >

                  <strong>
                    {teacher.full_name ||
                      "Nom non renseigné"}
                  </strong>

                  <span>
                    📞{" "}
                    {teacher.phone ||
                      "Téléphone non renseigné"}
                  </span>

                  <span>
                    {teacher.is_active
                      ? "🟢 Actif"
                      : "🔴 Désactivé"}
                  </span>

                  <div
                    style={{
                      marginTop:
                        "10px",
                    }}
                  >

                    <button
                      onClick={() =>
                        startEditTeacher(
                          teacher
                        )
                      }
                    >
                      ✏️ Modifier
                    </button>

                    <button
                      onClick={() =>
                        toggleTeacherStatus(
                          teacher
                        )
                      }
                    >
                      {teacher.is_active
                        ? "🔴 Désactiver"
                        : "🟢 Réactiver"}
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

        {/* =========================
            ÉLÈVES
        ========================== */}

        <div className="notice">

          <div className="top">

            <div>

              <h2>
                👨‍🎓 Élèves
              </h2>

              <p>
                {students.length} élève
                {students.length !== 1
                  ? "s"
                  : ""}
              </p>

            </div>

            <button
              onClick={() => {
                setShowStudentForm(
                  !showStudentForm
                );

                setEditingStudent(null);
              }}
            >
              {showStudentForm
                ? "Fermer"
                : "+ Nouvel élève"}
            </button>

          </div>

          {/* FORMULAIRE ÉLÈVE */}

          {showStudentForm && (
            <div className="card">

              <h2>
                Nouvel élève
              </h2>

              <p>
                Renseignez les informations
                de l'élève.
              </p>

              <label>
                Prénom
              </label>

              <input
                type="text"
                placeholder="Ex : Amadou"
                value={
                  studentFirstName
                }
                onChange={(e) =>
                  setStudentFirstName(
                    e.target.value
                  )
                }
                disabled={
                  creatingStudent
                }
              />

              <label>
                Nom
              </label>

              <input
                type="text"
                placeholder="Ex : Diop"
                value={
                  studentLastName
                }
                onChange={(e) =>
                  setStudentLastName(
                    e.target.value
                  )
                }
                disabled={
                  creatingStudent
                }
              />

              <label>
                École
              </label>

              <select
                value={
                  studentSchoolId
                }
                onChange={(e) => {
                  setStudentSchoolId(
                    e.target.value
                  );

                  setStudentClassId("");
                }}
                disabled={
                  creatingStudent
                }
              >

                <option value="">
                  Choisir une école
                </option>

                {schools.map(
                  (school) => (
                    <option
                      key={school.id}
                      value={school.id}
                    >
                      {school.name}
                    </option>
                  )
                )}

              </select>

              <label>
                Classe
              </label>

              <select
                value={
                  studentClassId
                }
                onChange={(e) =>
                  setStudentClassId(
                    e.target.value
                  )
                }
                disabled={
                  !studentSchoolId ||
                  creatingStudent
                }
              >

                <option value="">
                  {studentSchoolId
                    ? "Choisir une classe"
                    : "Choisir d'abord une école"}
                </option>

                {availableClasses.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                      {item.level
                        ? ` - ${item.level}`
                        : ""}
                    </option>
                  )
                )}

              </select>

              <label>
                Code élève
              </label>

              <input
                type="text"
                placeholder="Ex : EC-0001"
                value={
                  studentCode
                }
                onChange={(e) =>
                  setStudentCode(
                    e.target.value
                  )
                }
                disabled={
                  creatingStudent
                }
              />

              <button
                onClick={
                  createStudent
                }
                disabled={
                  creatingStudent
                }
              >
                {creatingStudent
                  ? "Création..."
                  : "👨‍🎓 Créer l'élève"}
              </button>

            </div>
          )}

          {/* MODIFICATION ÉLÈVE */}

          {editingStudent && (
            <div className="card">

              <h2>
                ✏️ Modifier l'élève
              </h2>

              <label>
                Prénom
              </label>

              <input
                type="text"
                value={
                  studentFirstName
                }
                onChange={(e) =>
                  setStudentFirstName(
                    e.target.value
                  )
                }
                disabled={
                  savingStudent
                }
              />

              <label>
                Nom
              </label>

              <input
                type="text"
                value={
                  studentLastName
                }
                onChange={(e) =>
                  setStudentLastName(
                    e.target.value
                  )
                }
                disabled={
                  savingStudent
                }
              />

              <label>
                École
              </label>

              <select
                value={
                  studentSchoolId
                }
                onChange={(e) => {
                  setStudentSchoolId(
                    e.target.value
                  );

                  setStudentClassId("");
                }}
                disabled={
                  savingStudent
                }
              >

                <option value="">
                  Choisir une école
                </option>

                {schools.map(
                  (school) => (
                    <option
                      key={school.id}
                      value={school.id}
                    >
                      {school.name}
                    </option>
                  )
                )}

              </select>

              <label>
                Classe
              </label>

              <select
                value={
                  studentClassId
                }
                onChange={(e) =>
                  setStudentClassId(
                    e.target.value
                  )
                }
                disabled={
                  !studentSchoolId ||
                  savingStudent
                }
              >

                <option value="">
                  Choisir une classe
                </option>

                {availableClasses.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                      {item.level
                        ? ` - ${item.level}`
                        : ""}
                    </option>
                  )
                )}

              </select>

              <label>
                Code élève
              </label>

              <input
                type="text"
                value={
                  studentCode
                }
                onChange={(e) =>
                  setStudentCode(
                    e.target.value
                  )
                }
                disabled={
                  savingStudent
                }
              />

              <button
                onClick={
                  saveStudent
                }
                disabled={
                  savingStudent
                }
              >
                {savingStudent
                  ? "Enregistrement..."
                  : "💾 Enregistrer"}
              </button>

              <button
                className="secondary"
                onClick={
                  cancelEditStudent
                }
                disabled={
                  savingStudent
                }
              >
                Annuler
              </button>

            </div>
          )}

          {/* LISTE DES ÉLÈVES */}

          <div
            style={{
              marginTop: "20px",
            }}
          >

            {students.length === 0 ? (

              <p>
                Aucun élève enregistré.
              </p>

            ) : (

              students.map(
                (student) => {

                  const isActive =
                    student.active !==
                    false;

                  return (
                    <div
                      key={student.id}
                      className="stat"
                      style={{
                        marginBottom:
                          "15px",
                      }}
                    >

                      <strong>
                        {student.first_name}{" "}
                        {student.last_name}
                      </strong>

                      <span>
                        🏫{" "}
                        {getSchoolName(
                          student.school_id
                        )}
                      </span>

                      <span>
                        📚{" "}
                        {getClassName(
                          student.class_id
                        )}
                      </span>

                      <span>
                        🆔{" "}
                        {student.student_code ||
                          "Code non renseigné"}
                      </span>

                      <span>
                        {isActive
                          ? "🟢 Actif"
                          : "🔴 Désactivé"}
                      </span>

                      <div
                        style={{
                          marginTop:
                            "10px",
                        }}
                      >

                        <button
                          onClick={() =>
                            startEditStudent(
                              student
                            )
                          }
                        >
                          ✏️ Modifier
                        </button>

                        <button
                          onClick={() =>
                            toggleStudentStatus(
                              student
                            )
                          }
                        >
                          {isActive
                            ? "🔴 Désactiver"
                            : "🟢 Réactiver"}
                        </button>

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>

        {/* =========================
            AUTRES MODULES
        ========================== */}

        <div className="grid">

          <button
            onClick={() =>
              setShowTeacherForm(
                true
              )
            }
          >
            👨‍🏫
            <br />
            Gérer les professeurs
          </button>

          <button
            onClick={() =>
              setShowStudentForm(
                true
              )
            }
          >
            👨‍🎓
            <br />
            Gérer les élèves
          </button>

          <button
            onClick={() =>
              alert(
                "La gestion des parents sera ajoutée prochainement."
              )
            }
          >
            👨‍👩‍👧
            <br />
            Gérer les parents
          </button>

          <button
            onClick={() =>
              alert(
                "La gestion des écoles sera ajoutée prochainement."
              )
            }
          >
            🏫
            <br />
            Gérer les écoles
          </button>

          <button
            onClick={() =>
              alert(
                "La gestion des classes sera ajoutée prochainement."
              )
            }
          >
            📚
            <br />
            Gérer les classes
          </button>

          <button
            onClick={() =>
              alert(
                "La gestion des matières sera ajoutée prochainement."
              )
            }
          >
            📖
            <br />
            Gérer les matières
          </button>

        </div>

      </section>
    </main>
  );
}
