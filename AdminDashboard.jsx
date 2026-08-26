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
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showSchoolForm, setShowSchoolForm] = useState(false);

  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);

  const [creatingTeacher, setCreatingTeacher] = useState(false);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);

  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");

  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [studentSchoolId, setStudentSchoolId] = useState("");
  const [studentClassId, setStudentClassId] = useState("");
  const [studentCode, setStudentCode] = useState("");

  const [schoolName, setSchoolName] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const teachersResponse = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, is_active")
        .eq("role", "teacher")
        .order("full_name");

      if (teachersResponse.error) throw teachersResponse.error;

      const studentsResponse = await supabase
        .from("students")
        .select(
          "id, school_id, class_id, first_name, last_name, student_code, photo_url, active, created_at"
        )
        .order("created_at", { ascending: false });

      if (studentsResponse.error) throw studentsResponse.error;

      const schoolsResponse = await supabase
        .from("schools")
        .select("id, name, address, city, phone, email, created_at")
        .order("name");

      if (schoolsResponse.error) throw schoolsResponse.error;

      const classesResponse = await supabase
        .from("classes")
        .select("id, school_id, name, level")
        .order("name");

      if (classesResponse.error) throw classesResponse.error;

      const parentsResponse = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "parent");

      if (parentsResponse.error) throw parentsResponse.error;

      const subjectsResponse = await supabase
        .from("subjects")
        .select("id", { count: "exact", head: true });

      if (subjectsResponse.error) throw subjectsResponse.error;

      const teacherList = teachersResponse.data || [];
      const studentList = studentsResponse.data || [];
      const schoolList = schoolsResponse.data || [];
      const classList = classesResponse.data || [];

      setTeachers(teacherList);
      setStudents(studentList);
      setSchools(schoolList);
      setClasses(classList);

      setStats({
        teachers: teacherList.length,
        students: studentList.length,
        parents: parentsResponse.count || 0,
        schools: schoolList.length,
        classes: classList.length,
        subjects: subjectsResponse.count || 0,
      });
    } catch (error) {
      console.error("Erreur chargement :", error);
      setErrorMessage(
        error.message || "Impossible de charger les données."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     PROFESSEURS
  ========================== */

  async function createTeacher() {
    setMessage("");
    setErrorMessage("");

    const name = teacherName.trim();
    const email = teacherEmail.trim().toLowerCase();
    const phone = teacherPhone.trim();

    if (!name) {
      setErrorMessage("Le nom du professeur est obligatoire.");
      return;
    }

    if (!email || !email.includes("@")) {
      setErrorMessage("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setCreatingTeacher(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-user",
        {
          body: {
            full_name: name,
            email,
            phone,
            role: "teacher",
          },
        }
      );

      if (error) throw new Error(error.message);

      if (!data?.success) {
        throw new Error(
          data?.error || "La création du professeur a échoué."
        );
      }

      setMessage("Professeur créé avec succès.");

      setTeacherName("");
      setTeacherEmail("");
      setTeacherPhone("");
      setShowTeacherForm(false);

      await loadData();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.message || "Impossible de créer le professeur."
      );
    } finally {
      setCreatingTeacher(false);
    }
  }

  function startEditTeacher(teacher) {
    setEditingTeacher(teacher);
    setTeacherName(teacher.full_name || "");
    setTeacherPhone(teacher.phone || "");
    setMessage("");
    setErrorMessage("");
  }

  function cancelEditTeacher() {
    setEditingTeacher(null);
    setTeacherName("");
    setTeacherPhone("");
  }

  async function saveTeacher() {
    if (!editingTeacher) return;

    const name = teacherName.trim();
    const phone = teacherPhone.trim();

    if (!name) {
      setErrorMessage("Le nom est obligatoire.");
      return;
    }

    setSavingTeacher(true);
    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          phone: phone || null,
        })
        .eq("id", editingTeacher.id)
        .eq("role", "teacher");

      if (error) throw error;

      setMessage("Professeur modifié avec succès.");
      cancelEditTeacher();
      await loadData();
    } catch (error) {
      setErrorMessage(
        error.message || "Impossible de modifier le professeur."
      );
    } finally {
      setSavingTeacher(false);
    }
  }

  async function toggleTeacherStatus(teacher) {
    const newStatus = !teacher.is_active;

    const confirmation = window.confirm(
      newStatus
        ? `Réactiver ${teacher.full_name || "ce professeur"} ?`
        : `Désactiver ${teacher.full_name || "ce professeur"} ?`
    );

    if (!confirmation) return;

    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: newStatus })
        .eq("id", teacher.id)
        .eq("role", "teacher");

      if (error) throw error;

      setMessage(
        newStatus
          ? "Professeur réactivé."
          : "Professeur désactivé."
      );

      await loadData();
    } catch (error) {
      setErrorMessage(
        error.message || "Impossible de modifier le statut."
      );
    }
  }

  /* =========================
     ÉLÈVES
  ========================== */

  async function createStudent() {
    setMessage("");
    setErrorMessage("");

    const firstName = studentFirstName.trim();
    const lastName = studentLastName.trim();

    if (!firstName) {
      setErrorMessage("Le prénom est obligatoire.");
      return;
    }

    if (!lastName) {
      setErrorMessage("Le nom est obligatoire.");
      return;
    }

    if (!studentSchoolId) {
      setErrorMessage("Veuillez choisir une école.");
      return;
    }

    if (!studentClassId) {
      setErrorMessage("Veuillez choisir une classe.");
      return;
    }

    setCreatingStudent(true);

    try {
      const { error } = await supabase
        .from("students")
        .insert({
          first_name: firstName,
          last_name: lastName,
          school_id: studentSchoolId,
          class_id: studentClassId,
          student_code: studentCode.trim() || null,
          active: true,
        });

      if (error) throw error;

      setMessage("Élève créé avec succès.");

      setStudentFirstName("");
      setStudentLastName("");
      setStudentSchoolId("");
      setStudentClassId("");
      setStudentCode("");
      setShowStudentForm(false);

      await loadData();
    } catch (error) {
      setErrorMessage(
        error.message || "Impossible de créer l'élève."
      );
    } finally {
      setCreatingStudent(false);
    }
  }

  function startEditStudent(student) {
    setEditingStudent(student);

    setStudentFirstName(student.first_name || "");
    setStudentLastName(student.last_name || "");
    setStudentSchoolId(student.school_id || "");
    setStudentClassId(student.class_id || "");
    setStudentCode(student.student_code || "");

    setMessage("");
    setErrorMessage("");
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
    if (!editingStudent) return;

    if (!studentFirstName.trim()) {
      setErrorMessage("Le prénom est obligatoire.");
      return;
    }

    if (!studentLastName.trim()) {
      setErrorMessage("Le nom est obligatoire.");
      return;
    }

    if (!studentSchoolId) {
      setErrorMessage("Veuillez choisir une école.");
      return;
    }

    if (!studentClassId) {
      setErrorMessage("Veuillez choisir une classe.");
      return;
    }

    setSavingStudent(true);
    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("students")
        .update({
          first_name: studentFirstName.trim(),
          last_name: studentLastName.trim(),
          school_id: studentSchoolId,
          class_id: studentClassId,
          student_code: studentCode.trim() || null,
        })
        .eq("id", editingStudent.id);

      if (error) throw error;

      setMessage("Élève modifié avec succès.");
      cancelEditStudent();
      await loadData();
    } catch (error) {
      setErrorMessage(
        error.message || "Impossible de modifier l'élève."
      );
    } finally {
      setSavingStudent(false);
    }
  }

  async function toggleStudentStatus(student) {
    const newStatus = student.active === false;

    const fullName =
      `${student.first_name || ""} ${student.last_name || ""}`.trim();

    const confirmation = window.confirm(
      newStatus
        ? `Réactiver ${fullName || "cet élève"} ?`
        : `Désactiver ${fullName || "cet élève"} ?`
    );

    if (!confirmation) return;

    try {
      const { error } = await supabase
        .from("students")
        .update({ active: newStatus })
        .eq("id", student.id);

      if (error) throw error;

      setMessage(
        newStatus
          ? "Élève réactivé."
          : "Élève désactivé."
      );

      await loadData();
    } catch (error) {
      setErrorMessage(
        error.message || "Impossible de modifier l'élève."
      );
    }
  }

  /* =========================
     ÉCOLES
  ========================== */

  function resetSchoolForm() {
    setSchoolName("");
    setSchoolAddress("");
    setSchoolCity("");
    setSchoolPhone("");
    setSchoolEmail("");
    setEditingSchool(null);
  }

  function startEditSchool(school) {
    setEditingSchool(school);

    setSchoolName(school.name || "");
    setSchoolAddress(school.address || "");
    setSchoolCity(school.city || "");
    setSchoolPhone(school.phone || "");
    setSchoolEmail(school.email || "");

    setShowSchoolForm(true);
    setMessage("");
    setErrorMessage("");
  }

  async function saveSchool() {
    const name = schoolName.trim();

    if (!name) {
      setErrorMessage("Le nom de l'école est obligatoire.");
      return;
    }

    setSavingSchool(true);
    setMessage("");
    setErrorMessage("");

    try {
      const schoolData = {
        name,
        address: schoolAddress.trim() || null,
        city: schoolCity.trim() || null,
        phone: schoolPhone.trim() || null,
        email: schoolEmail.trim() || null,
      };

      if (editingSchool) {
        const { error } = await supabase
          .from("schools")
          .update(schoolData)
          .eq("id", editingSchool.id);

        if (error) throw error;

        setMessage("École modifiée avec succès.");
      } else {
        const { error } = await supabase
          .from("schools")
          .insert(schoolData);

        if (error) throw error;

        setMessage("École créée avec succès.");
      }

      resetSchoolForm();
      setShowSchoolForm(false);

      await loadData();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error.message || "Impossible d'enregistrer l'école."
      );
    } finally {
      setSavingSchool(false);
    }
  }

  async function deleteSchool(school) {
    const hasStudents = students.some(
      (student) => student.school_id === school.id
    );

    if (hasStudents) {
      setErrorMessage(
        "Cette école possède encore des élèves. Modifiez ou déplacez les élèves avant de supprimer l'école."
      );
      return;
    }

    const confirmation = window.confirm(
      `Supprimer définitivement l'école "${school.name}" ?`
    );

    if (!confirmation) return;

    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("schools")
        .delete()
        .eq("id", school.id);

      if (error) throw error;

      setMessage("École supprimée avec succès.");

      await loadData();
    } catch (error) {
      setErrorMessage(
        error.message || "Impossible de supprimer l'école."
      );
    }
  }

  /* =========================
     OUTILS
  ========================== */

  function getSchoolName(schoolId) {
    const school = schools.find(
      (item) => item.id === schoolId
    );

    return school?.name || "École non définie";
  }

  function getClassName(classId) {
    const item = classes.find(
      (classItem) => classItem.id === classId
    );

    if (!item) return "Classe non définie";

    return `${item.name || ""}${
      item.level ? ` - ${item.level}` : ""
    }`;
  }

  const availableClasses = studentSchoolId
    ? classes.filter(
        (item) => item.school_id === studentSchoolId
      )
    : [];

  if (loading) {
    return (
      <div className="center">
        Chargement de l'administration…
      </div>
    );
  }

  return (
    <main className="page">
      <section className="card dashboard">

        {/* =========================
            EN-TÊTE
        ========================== */}

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

        {/* =========================
            STATISTIQUES
        ========================== */}

        <div className="grid">

          <div className="stat">
            <strong>{stats.teachers}</strong>
            <span>Professeurs</span>
          </div>

          <div className="stat">
            <strong>{stats.students}</strong>
            <span>Élèves</span>
          </div>

          <div className="stat">
            <strong>{stats.parents}</strong>
            <span>Parents</span>
          </div>

          <div className="stat">
            <strong>{stats.schools}</strong>
            <span>Écoles</span>
          </div>

          <div className="stat">
            <strong>{stats.classes}</strong>
            <span>Classes</span>
          </div>

          <div className="stat">
            <strong>{stats.subjects}</strong>
            <span>Matières</span>
          </div>

        </div>

        {/* =========================
            ÉCOLES
        ========================== */}

        <div className="notice">

          <div className="top">

            <div>
              <h2>
                🏫 Écoles
              </h2>

              <p>
                {schools.length} école
                {schools.length !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={() => {
                if (showSchoolForm) {
                  resetSchoolForm();
                }

                setShowSchoolForm(
                  !showSchoolForm
                );
              }}
            >
              {showSchoolForm
                ? "Fermer"
                : "+ Nouvelle école"}
            </button>

          </div>

          {showSchoolForm && (
            <div className="card">

              <h2>
                {editingSchool
                  ? "✏️ Modifier l'école"
                  : "🏫 Nouvelle école"}
              </h2>

              <label>
                Nom de l'école
              </label>

              <input
                type="text"
                placeholder="Ex : École Connectée Dakar"
                value={schoolName}
                onChange={(e) =>
                  setSchoolName(e.target.value)
                }
              />

              <label>
                Adresse
              </label>

              <input
                type="text"
                placeholder="Ex : Dakar"
                value={schoolAddress}
                onChange={(e) =>
                  setSchoolAddress(e.target.value)
                }
              />

              <label>
                Ville
              </label>

              <input
                type="text"
                placeholder="Ex : Dakar"
                value={schoolCity}
                onChange={(e) =>
                  setSchoolCity(e.target.value)
                }
              />

              <label>
                Téléphone
              </label>

              <input
                type="tel"
                placeholder="Ex : 77 000 00 00"
                value={schoolPhone}
                onChange={(e) =>
                  setSchoolPhone(e.target.value)
                }
              />

              <label>
                E-mail
              </label>

              <input
                type="email"
                placeholder="ecole@email.com"
                value={schoolEmail}
                onChange={(e) =>
                  setSchoolEmail(e.target.value)
                }
              />

              <button
                onClick={saveSchool}
                disabled={savingSchool}
              >
                {savingSchool
                  ? "Enregistrement..."
                  : editingSchool
                  ? "💾 Enregistrer les modifications"
                  : "🏫 Créer l'école"}
              </button>

              {editingSchool && (
                <button
                  className="secondary"
                  onClick={() => {
                    resetSchoolForm();
                    setShowSchoolForm(false);
                  }}
                >
                  Annuler
                </button>
              )}

            </div>
          )}

          <div style={{ marginTop: "20px" }}>

            {schools.length === 0 ? (
              <p>
                Aucune école enregistrée.
              </p>
            ) : (
              schools.map((school) => (
                <div
                  key={school.id}
                  className="stat"
                  style={{
                    marginBottom: "15px",
                  }}
                >

                  <strong>
                    🏫 {school.name}
                  </strong>

                  <span>
                    📍 {school.city || "Ville non renseignée"}
                  </span>

                  <span>
                    🏠 {school.address || "Adresse non renseignée"}
                  </span>

                  <span>
                    📞 {school.phone || "Téléphone non renseigné"}
                  </span>

                  <span>
                    ✉️ {school.email || "E-mail non renseigné"}
                  </span>

                  <div style={{ marginTop: "10px" }}>

                    <button
                      onClick={() =>
                        startEditSchool(school)
                      }
                    >
                      ✏️ Modifier
                    </button>

                    <button
                      onClick={() =>
                        deleteSchool(school)
                      }
                    >
                      🗑️ Supprimer
                    </button>

                  </div>

                </div>
              ))
            )}

          </div>

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
                {teachers.length !== 1 ? "s" : ""}
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

          {showTeacherForm && (
            <div className="card">

              <h2>
                Nouveau professeur
              </h2>

              <label>
                Nom complet
              </label>

              <input
                type="text"
                placeholder="Ex : Mamadou Diop"
                value={teacherName}
                onChange={(e) =>
                  setTeacherName(e.target.value)
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
                  setTeacherEmail(e.target.value)
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
                  setTeacherPhone(e.target.value)
                }
              />

              <button
                onClick={createTeacher}
                disabled={creatingTeacher}
              >
                {creatingTeacher
                  ? "Création..."
                  : "👨‍🏫 Créer le professeur"}
              </button>

            </div>
          )}

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
                  setTeacherName(e.target.value)
                }
              />

              <label>
                Téléphone
              </label>

              <input
                type="tel"
                value={teacherPhone}
                onChange={(e) =>
                  setTeacherPhone(e.target.value)
                }
              />

              <button
                onClick={saveTeacher}
                disabled={savingTeacher}
              >
                {savingTeacher
                  ? "Enregistrement..."
                  : "💾 Enregistrer"}
              </button>

              <button
                className="secondary"
                onClick={cancelEditTeacher}
              >
                Annuler
              </button>

            </div>
          )}

          <div style={{ marginTop: "20px" }}>

            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="stat"
                style={{ marginBottom: "15px" }}
              >

                <strong>
                  {teacher.full_name || "Nom non renseigné"}
                </strong>

                <span>
                  📞 {teacher.phone || "Téléphone non renseigné"}
                </span>

                <span>
                  {teacher.is_active
                    ? "🟢 Actif"
                    : "🔴 Désactivé"}
                </span>

                <div style={{ marginTop: "10px" }}>

                  <button
                    onClick={() =>
                      startEditTeacher(teacher)
                    }
                  >
                    ✏️ Modifier
                  </button>

                  <button
                    onClick={() =>
                      toggleTeacherStatus(teacher)
                    }
                  >
                    {teacher.is_active
                      ? "🔴 Désactiver"
                      : "🟢 Réactiver"}
                  </button>

                </div>

              </div>
            ))}

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
                {students.length !== 1 ? "s" : ""}
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

          {showStudentForm && (
            <div className="card">

              <h2>
                Nouvel élève
              </h2>

              <label>
                Prénom
              </label>

              <input
                type="text"
                placeholder="Ex : Amadou"
                value={studentFirstName}
                onChange={(e) =>
                  setStudentFirstName(e.target.value)
                }
              />

              <label>
                Nom
              </label>

              <input
                type="text"
                placeholder="Ex : Diop"
                value={studentLastName}
                onChange={(e) =>
                  setStudentLastName(e.target.value)
                }
              />

              <label>
                École
              </label>

              <select
                value={studentSchoolId}
                onChange={(e) => {
                  setStudentSchoolId(e.target.value);
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
                  setStudentClassId(e.target.value)
                }
                disabled={!studentSchoolId}
              >
                <option value="">
                  {studentSchoolId
                    ? "Choisir une classe"
                    : "Choisir d'abord une école"}
                </option>

                {availableClasses.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                    {item.level
                      ? ` - ${item.level}`
                      : ""}
                  </option>
                ))}
              </select>

              <label>
                Code élève
              </label>

              <input
                type="text"
                placeholder="Ex : EC-0001"
                value={studentCode}
                onChange={(e) =>
                  setStudentCode(e.target.value)
                }
              />

              <button
                onClick={createStudent}
                disabled={creatingStudent}
              >
                {creatingStudent
                  ? "Création..."
                  : "👨‍🎓 Créer l'élève"}
              </button>

            </div>
          )}

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
                value={studentFirstName}
                onChange={(e) =>
                  setStudentFirstName(e.target.value)
                }
              />

              <label>
                Nom
              </label>

              <input
                type="text"
                value={studentLastName}
                onChange={(e) =>
                  setStudentLastName(e.target.value)
                }
              />

              <label>
                École
              </label>

              <select
                value={studentSchoolId}
                onChange={(e) => {
                  setStudentSchoolId(e.target.value);
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
                  setStudentClassId(e.target.value)
                }
                disabled={!studentSchoolId}
              >
                <option value="">
                  Choisir une classe
                </option>

                {availableClasses.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                    {item.level
                      ? ` - ${item.level}`
                      : ""}
                  </option>
                ))}
              </select>

              <label>
                Code élève
              </label>

              <input
                type="text"
                value={studentCode}
                onChange={(e) =>
                  setStudentCode(e.target.value)
                }
              />

              <button
                onClick={saveStudent}
                disabled={savingStudent}
              >
                {savingStudent
                  ? "Enregistrement..."
                  : "💾 Enregistrer"}
              </button>

              <button
                className="secondary"
                onClick={cancelEditStudent}
              >
                Annuler
              </button>

            </div>
          )}

          <div style={{ marginTop: "20px" }}>

            {students.length === 0 ? (
              <p>
                Aucun élève enregistré.
              </p>
            ) : (
              students.map((student) => {
                const isActive =
                  student.active !== false;

                return (
                  <div
                    key={student.id}
                    className="stat"
                    style={{
                      marginBottom: "15px",
                    }}
                  >

                    <strong>
                      {student.first_name}{" "}
                      {student.last_name}
                    </strong>

                    <span>
                      🏫 {getSchoolName(student.school_id)}
                    </span>

                    <span>
                      📚 {getClassName(student.class_id)}
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

                    <div style={{ marginTop: "10px" }}>

                      <button
                        onClick={() =>
                          startEditStudent(student)
                        }
                      >
                        ✏️ Modifier
                      </button>

                      <button
                        onClick={() =>
                          toggleStudentStatus(student)
                        }
                      >
                        {isActive
                          ? "🔴 Désactiver"
                          : "🟢 Réactiver"}
                      </button>

                    </div>

                  </div>
                );
              })
            )}

          </div>

        </div>

        {/* =========================
            AUTRES MODULES
        ========================== */}

        <div className="grid">

          <button
            onClick={() =>
              setShowTeacherForm(true)
            }
          >
            👨‍🏫
            <br />
            Gérer les professeurs
          </button>

          <button
            onClick={() =>
              setShowStudentForm(true)
            }
          >
            👨‍🎓
            <br />
            Gérer les élèves
          </button>

          <button
            onClick={() =>
              setShowSchoolForm(true)
            }
          >
            🏫
            <br />
            Gérer les écoles
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
