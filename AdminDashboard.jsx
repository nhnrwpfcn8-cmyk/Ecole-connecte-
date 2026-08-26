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
    documents: 0,
    exercises: 0,
    notifications: 0,
  });

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // 👑 CONTRÔLE TOTAL ADMIN
  const [adminDocuments, setAdminDocuments] = useState([]);
  const [adminExercises, setAdminExercises] = useState([]);
  const [adminAttendance, setAdminAttendance] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [adminControlLoading, setAdminControlLoading] = useState(false);
  const [adminControlTab, setAdminControlTab] = useState("documents");
  const [activeSection, setActiveSection] = useState("dashboard");

  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);

  const [teacherForm, setTeacherForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [schoolForm, setSchoolForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
  });

  const [classForm, setClassForm] = useState({
    school_id: "",
    name: "",
    level: "",
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
  });

  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const [
        teachersResult,
        studentsResult,
        parentsResult,
        schoolsResult,
        classesResult,
        subjectsResult,
        documentsResult,
        exercisesResult,
        questionsResult,
        notificationsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("role", "teacher")
          .order("full_name"),

        supabase
          .from("students")
          .select("*")
          .order("id"),

        supabase
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("role", "parent")
          .order("full_name"),

        supabase
          .from("schools")
          .select("id, name, address, city, phone, email")
          .order("name"),

        supabase
          .from("classes")
          .select("id, school_id, name, level")
          .order("name"),

        supabase
          .from("subjects")
          .select("id, name")
          .order("name"),

        supabase
          .from("documents")
          .select(
            "id, teacher_id, class_id, subject_id, title, description, document_type, file_url, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("exercises")
          .select(
            "id, teacher_id, school_id, class_id, subject_id, title, description, instructions, duration_minutes, published, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("exercise_questions")
          .select(
            "id, exercise_id, question, question_type, options, correct_answer, points, position, created_at"
          )
          .order("position"),

        supabase
          .from("notifications")
          .select(
            "id, recipient_id, student_id, type, title, message, read, created_at"
          )
          .order("created_at", { ascending: false }),
      ]);

      const optionalErrors = [
        documentsResult.error,
        exercisesResult.error,
        questionsResult.error,
        notificationsResult.error,
      ].filter(Boolean);

      const requiredErrors = [
        teachersResult.error,
        schoolsResult.error,
        classesResult.error,
        subjectsResult.error,
      ].filter(Boolean);

      if (requiredErrors.length > 0) {
        throw requiredErrors[0];
      }

      if (studentsResult.error) {
        console.warn(
          "Impossible de charger les élèves :",
          studentsResult.error.message
        );
      }

      if (parentsResult.error) {
        console.warn(
          "Impossible de charger les parents :",
          parentsResult.error.message
        );
      }

      if (optionalErrors.length > 0) {
        console.warn(
          "Certaines données secondaires n'ont pas pu être chargées."
        );
        optionalErrors.forEach((error) =>
          console.warn(error.message)
        );
      }

      const teacherData = teachersResult.data || [];
      const studentData = studentsResult.data || [];
      const parentData = parentsResult.data || [];
      const schoolData = schoolsResult.data || [];
      const classData = classesResult.data || [];
      const subjectData = subjectsResult.data || [];
      const documentData = documentsResult.data || [];
      const exerciseData = exercisesResult.data || [];
      const questionData = questionsResult.data || [];
      const notificationData = notificationsResult.data || [];

      setTeachers(teacherData);
      setStudents(studentData);
      setParents(parentData);
      setSchools(schoolData);
      setClasses(classData);
      setSubjects(subjectData);
      setDocuments(documentData);
      setExercises(exerciseData);
      setQuestions(questionData);
      setNotifications(notificationData);

      setStats({
        teachers: teacherData.length,
        students: studentData.length,
        parents: parentData.length,
        schools: schoolData.length,
        classes: classData.length,
        subjects: subjectData.length,
        documents: documentData.length,
        exercises: exerciseData.length,
        notifications: notificationData.length,
      });
    } catch (error) {
      console.error(error);

      setMessage(
        "Impossible de charger les données : " +
          (error?.message || "Erreur inconnue")
      );
    } finally {
      setLoading(false);
    }
  }
  async function loadAdminControlData() {
    setAdminControlLoading(true);

    try {
      const [
        documentsResult,
        exercisesResult,
        attendanceResult,
        notificationsResult,
      ] = await Promise.all([
        supabase
          .from("documents")
          .select(`
            id,
            teacher_id,
            class_id,
            subject_id,
            title,
            description,
            document_type,
            file_url,
            created_at
          `)
          .order("created_at", { ascending: false }),

        supabase
          .from("exercises")
          .select(`
            id,
            teacher_id,
            school_id,
            class_id,
            subject_id,
            title,
            description,
            instructions,
            duration_minutes,
            published,
            created_at
          `)
          .order("created_at", { ascending: false }),

        supabase
          .from("attendance")
          .select(`
            id,
            student_id,
            date,
            arrival_time,
            departure_time,
            status,
            recorded_by,
            created_at
          `)
          .order("date", { ascending: false }),

        supabase
          .from("notifications")
          .select(`
            id,
            recipient_id,
            student_id,
            type,
            title,
            message,
            read,
            created_at
          `)
          .order("created_at", { ascending: false }),
      ]);

      if (documentsResult.error) {
        console.error(
          "Erreur documents :",
          documentsResult.error
        );
      }

      if (exercisesResult.error) {
        console.error(
          "Erreur exercices :",
          exercisesResult.error
        );
      }

      if (attendanceResult.error) {
        console.error(
          "Erreur présences :",
          attendanceResult.error
        );
      }

      if (notificationsResult.error) {
        console.error(
          "Erreur notifications :",
          notificationsResult.error
        );
      }

      setAdminDocuments(
        documentsResult.data || []
      );

      setAdminExercises(
        exercisesResult.data || []
      );

      setAdminAttendance(
        attendanceResult.data || []
      );

      setAdminNotifications(
        notificationsResult.data || []
      );
    } catch (error) {
      console.error(
        "Erreur contrôle total :",
        error
      );
    } finally {
      setAdminControlLoading(false);
    }
  }
  async function createTeacher(e) {
    e.preventDefault();
    setMessage("");

    try {
      const { data, error } =
        await supabase.functions.invoke("create-user", {
          body: {
            full_name: teacherForm.full_name,
            email: teacherForm.email,
            phone: teacherForm.phone,
            role: "teacher",
          },
        });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Impossible de créer le professeur."
        );
      }

      setMessage("Professeur créé avec succès.");

      setTeacherForm({
        full_name: "",
        email: "",
        phone: "",
      });

      setShowTeacherForm(false);

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur création professeur : " +
          (error?.message || "Erreur inconnue")
      );
    }
  }

  async function updateTeacher(e) {
    e.preventDefault();
    setMessage("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: teacherForm.full_name,
          phone: teacherForm.phone,
        })
        .eq("id", editingTeacher.id);

      if (error) throw error;

      setMessage("Professeur modifié avec succès.");

      setEditingTeacher(null);

      setTeacherForm({
        full_name: "",
        email: "",
        phone: "",
      });

      setShowTeacherForm(false);

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur modification professeur : " +
          error.message
      );
    }
  }

  async function toggleTeacher(teacher) {
    setMessage("");

    try {
      const newRole =
        teacher.role === "teacher"
          ? "inactive"
          : "teacher";

      const { error } = await supabase
        .from("profiles")
        .update({
          role: newRole,
        })
        .eq("id", teacher.id);

      if (error) throw error;

      setMessage(
        newRole === "teacher"
          ? "Professeur réactivé."
          : "Professeur désactivé."
      );

      await loadData();
    } catch (error) {
      setMessage("Erreur : " + error.message);
    }
  }

  async function saveSchool(e) {
    e.preventDefault();
    setMessage("");

    try {
      if (editingSchool) {
        const { error } = await supabase
          .from("schools")
          .update(schoolForm)
          .eq("id", editingSchool.id);

        if (error) throw error;

        setMessage("École modifiée avec succès.");
      } else {
        const { error } = await supabase
          .from("schools")
          .insert([schoolForm]);

        if (error) throw error;

        setMessage("École créée avec succès.");
      }

      resetSchoolForm();

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur école : " + error.message
      );
    }
  }

  async function deleteSchool(school) {
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette école ?"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("schools")
        .delete()
        .eq("id", school.id);

      if (error) throw error;

      setMessage("École supprimée.");

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur suppression école : " +
          error.message
      );
    }
  }

  async function saveClass(e) {
    e.preventDefault();
    setMessage("");

    if (!classForm.school_id) {
      setMessage("Veuillez choisir une école.");
      return;
    }

    if (!classForm.name.trim()) {
      setMessage(
        "Veuillez saisir le nom de la classe."
      );
      return;
    }

    try {
      const values = {
        school_id: classForm.school_id,
        name: classForm.name.trim(),
        level: classForm.level.trim() || null,
      };

      if (editingClass) {
        const { error } = await supabase
          .from("classes")
          .update(values)
          .eq("id", editingClass.id);

        if (error) throw error;

        setMessage("Classe modifiée avec succès.");
      } else {
        const { error } = await supabase
          .from("classes")
          .insert([values]);

        if (error) throw error;

        setMessage("Classe créée avec succès.");
      }

      resetClassForm();

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur classe : " + error.message
      );
    }
  }

  async function deleteClass(classItem) {
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette classe ?"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classItem.id);

      if (error) throw error;

      setMessage("Classe supprimée.");

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur suppression classe : " +
          error.message
      );
    }
  }

  async function saveSubject(e) {
    e.preventDefault();
    setMessage("");

    const name = subjectForm.name.trim();

    if (!name) {
      setMessage(
        "Veuillez saisir le nom de la matière."
      );
      return;
    }

    try {
      if (editingSubject) {
        const { error } = await supabase
          .from("subjects")
          .update({ name })
          .eq("id", editingSubject.id);

        if (error) throw error;

        setMessage(
          "Matière modifiée avec succès."
        );
      } else {
        const { error } = await supabase
          .from("subjects")
          .insert([{ name }]);

        if (error) throw error;

        setMessage("Matière créée avec succès.");
      }

      resetSubjectForm();

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur matière : " + error.message
      );
    }
  }

  async function deleteSubject(subject) {
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cette matière ?"
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subject.id);

      if (error) throw error;

      setMessage("Matière supprimée.");

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur suppression matière : " +
          error.message
      );
    }
  }

  function resetTeacherForm() {
    setTeacherForm({
      full_name: "",
      email: "",
      phone: "",
    });

    setEditingTeacher(null);
    setShowTeacherForm(false);
  }

  function resetSchoolForm() {
    setSchoolForm({
      name: "",
      address: "",
      city: "",
      phone: "",
      email: "",
    });

    setEditingSchool(null);
    setShowSchoolForm(false);
  }

  function resetClassForm() {
    setClassForm({
      school_id: "",
      name: "",
      level: "",
    });

    setEditingClass(null);
    setShowClassForm(false);
  }

  function resetSubjectForm() {
    setSubjectForm({
      name: "",
    });

    setEditingSubject(null);
    setShowSubjectForm(false);
  }

  function startEditTeacher(teacher) {
    setEditingTeacher(teacher);

    setTeacherForm({
      full_name: teacher.full_name || "",
      email: "",
      phone: teacher.phone || "",
    });

    setShowTeacherForm(true);
  }

  function startEditSchool(school) {
    setEditingSchool(school);

    setSchoolForm({
      name: school.name || "",
      address: school.address || "",
      city: school.city || "",
      phone: school.phone || "",
      email: school.email || "",
    });

    setShowSchoolForm(true);
  }

  function startEditClass(classItem) {
    setEditingClass(classItem);

    setClassForm({
      school_id: classItem.school_id || "",
      name: classItem.name || "",
      level: classItem.level || "",
    });

    setShowClassForm(true);
  }

  function startEditSubject(subject) {
    setEditingSubject(subject);

    setSubjectForm({
      name: subject.name || "",
    });

    setShowSubjectForm(true);
  }

  function getSchoolName(schoolId) {
    return (
      schools.find(
        (school) => school.id === schoolId
      )?.name || "École inconnue"
    );
  }

  function getClassName(classId) {
    return (
      classes.find(
        (item) => item.id === classId
      )?.name || "Classe inconnue"
    );
  }

  function getSubjectName(subjectId) {
    return (
      subjects.find(
        (item) =>
          String(item.id) === String(subjectId)
      )?.name || "Matière inconnue"
    );
  }

  function getTeacherName(teacherId) {
    return (
      teachers.find(
        (teacher) => teacher.id === teacherId
      )?.full_name || "Professeur inconnu"
    );
  }

  function getStudentName(studentId) {
    const student = students.find(
      (item) => item.id === studentId
    );

    if (!student) return "Élève inconnu";

    return (
      student.full_name ||
      student.name ||
      `Élève ${student.id}`
    );
  }

  function getExerciseName(exerciseId) {
    return (
      exercises.find(
        (exercise) => exercise.id === exerciseId
      )?.title || "Exercice inconnu"
    );
  }

  function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleString(
      "fr-FR"
    );
  }

  function openSection(section) {
    setActiveSection(section);
    setMessage("");
  }

  function renderNavigation() {
    return (
      <div className="notice">
        <h2>🛠️ Administration</h2>

        <div className="grid">
          <button
            onClick={() =>
              openSection("dashboard")
            }
          >
            📊 Tableau de bord
          </button>

          <button
            onClick={() =>
              openSection("teachers")
            }
          >
            👨‍🏫 Professeurs
          </button>

          <button
            onClick={() =>
              openSection("students")
            }
          >
            👨‍🎓 Élèves
          </button>

          <button
            onClick={() =>
              openSection("parents")
            }
          >
            👪 Parents
          </button>

          <button
            onClick={() =>
              openSection("schools")
            }
          >
            🏫 Écoles
          </button>

          <button
            onClick={() =>
              openSection("classes")
            }
          >
            📚 Classes
          </button>

          <button
            onClick={() =>
              openSection("subjects")
            }
          >
            📖 Matières
          </button>

          <button
            onClick={() =>
              openSection("documents")
            }
          >
            📄 Leçons / Documents
          </button>

          <button
            onClick={() =>
              openSection("exercises")
            }
          >
            📝 Exercices
          </button>

          <button
            onClick={() =>
              openSection("questions")
            }
          >
            ❓ Questions
          </button>

          <button
  onClick={() =>
    openSection("notifications")
  }
>
  🔔 Notifications / échanges
</button>

<button
  onClick={() => {
    openSection("admin-control");
    loadAdminControlData();
  }}
>
  👑 Contrôle total
</button>
</div>
</div>
);
}

  function renderDashboard() {
    return (
      <>
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

          <div className="stat">
            <strong>{stats.documents}</strong>
            <span>Documents</span>
          </div>

          <div className="stat">
            <strong>{stats.exercises}</strong>
            <span>Exercices</span>
          </div>

          <div className="stat">
            <strong>{stats.notifications}</strong>
            <span>Notifications</span>
          </div>
        </div>

        <div className="notice">
          <h2>🎯 Contrôle administrateur</h2>

          <p>
            Depuis cet espace, vous pouvez consulter
            les principales données de l'application
            École Connectée.
          </p>

          <p>
            L'administrateur peut gérer les écoles,
            classes, matières et professeurs, et
            consulter les documents, exercices,
            questions et notifications.
          </p>
        </div>
      </>
    );
  }

  function renderTeachers() {
    return (
      <>
        <div className="notice">
          <h2>
            👨‍🏫 Gestion des professeurs
          </h2>

          <button
            onClick={() => {
              if (showTeacherForm) {
                resetTeacherForm();
              } else {
                setEditingTeacher(null);
                setTeacherForm({
                  full_name: "",
                  email: "",
                  phone: "",
                });
                setShowTeacherForm(true);
              }
            }}
          >
            {showTeacherForm
              ? "Fermer"
              : "➕ Nouveau professeur"}
          </button>
        </div>

        {showTeacherForm && (
          <form
            className="notice"
            onSubmit={
              editingTeacher
                ? updateTeacher
                : createTeacher
            }
          >
            <h3>
              {editingTeacher
                ? "Modifier le professeur"
                : "Nouveau professeur"}
            </h3>

            <label>Nom complet</label>

            <input
              type="text"
              placeholder="Ex : Mamadou Diop"
              value={teacherForm.full_name}
              onChange={(e) =>
                setTeacherForm({
                  ...teacherForm,
                  full_name: e.target.value,
                })
              }
              required
            />

            {!editingTeacher && (
              <>
                <label>
                  Adresse e-mail
                </label>

                <input
                  type="email"
                  placeholder="professeur@email.com"
                  value={teacherForm.email}
                  onChange={(e) =>
                    setTeacherForm({
                      ...teacherForm,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </>
            )}

            <label>Téléphone</label>

            <input
              type="text"
              placeholder="77 000 00 00"
              value={teacherForm.phone}
              onChange={(e) =>
                setTeacherForm({
                  ...teacherForm,
                  phone: e.target.value,
                })
              }
            />

            <button type="submit">
              {editingTeacher
                ? "💾 Enregistrer"
                : "Créer le professeur"}
            </button>
          </form>
        )}

        <div className="grid">
          {teachers.length === 0 ? (
            <div className="notice">
              Aucun professeur.
            </div>
          ) : (
            teachers.map((teacher) => (
              <div
                className="stat"
                key={teacher.id}
              >
                <strong>
                  {teacher.full_name ||
                    "Sans nom"}
                </strong>

                <span>
                  {teacher.phone ||
                    "Téléphone non renseigné"}
                </span>

                <span>
                  Rôle : {teacher.role}
                </span>

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
                    toggleTeacher(
                      teacher
                    )
                  }
                >
                  {teacher.role === "teacher"
                    ? "🚫 Désactiver"
                    : "✅ Réactiver"}
                </button>
              </div>
            ))
          )}
        </div>
      </>
    );
  }

  function renderStudents() {
    return (
      <>
        <div className="notice">
          <h2>👨‍🎓 Tous les élèves</h2>

          <p>
            Total : {students.length}
          </p>
        </div>

        <div className="grid">
          {students.length === 0 ? (
            <div className="notice">
              Aucun élève trouvé.
            </div>
          ) : (
            students.map((student) => (
              <div
                className="stat"
                key={student.id}
              >
                <strong>
                  {student.full_name ||
                    student.name ||
                    "Élève sans nom"}
                </strong>

                <span>
                  ID : {student.id}
                </span>

                {student.class_id && (
                  <span>
                    Classe :{" "}
                    {getClassName(
                      student.class_id
                    )}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </>
    );
  }

  function renderParents() {
    return (
      <>
        <div className="notice">
          <h2>👪 Tous les parents</h2>

          <p>
            Total : {parents.length}
          </p>
        </div>

        <div className="grid">
          {parents.length === 0 ? (
            <div className="notice">
              Aucun parent trouvé.
            </div>
          ) : (
            parents.map((parent) => (
              <div
                className="stat"
                key={parent.id}
              >
                <strong>
                  {parent.full_name ||
                    "Parent sans nom"}
                </strong>

                <span>
                  {parent.phone ||
                    "Téléphone non renseigné"}
                </span>

                <span>
                  Rôle : {parent.role}
                </span>
              </div>
            ))
          )}
        </div>
      </>
    );
  }

  function renderSchools() {
    return (
      <>
        <div className="notice">
          <h2>🏫 Gestion des écoles</h2>

          <button
            onClick={() => {
              if (showSchoolForm) {
                resetSchoolForm();
              } else {
                setEditingSchool(null);
                setSchoolForm({
                  name: "",
                  address: "",
                  city: "",
                  phone: "",
                  email: "",
                });
                setShowSchoolForm(true);
              }
            }}
          >
            {showSchoolForm
              ? "Fermer"
              : "➕ Nouvelle école"}
          </button>
        </div>

        {showSchoolForm && (
          <form
            className="notice"
            onSubmit={saveSchool}
          >
            <h3>
              {editingSchool
                ? "Modifier l'école"
                : "Nouvelle école"}
            </h3>

            <label>Nom de l'école</label>

            <input
              type="text"
              placeholder="Ex : École Connectée"
              value={schoolForm.name}
              onChange={(e) =>
                setSchoolForm({
                  ...schoolForm,
                  name: e.target.value,
                })
              }
              required
            />

            <label>Adresse</label>

            <input
              type="text"
              value={schoolForm.address}
              onChange={(e) =>
                setSchoolForm({
                  ...schoolForm,
                  address: e.target.value,
                })
              }
            />

            <label>Ville</label>

            <input
              type="text"
              placeholder="Dakar"
              value={schoolForm.city}
              onChange={(e) =>
                setSchoolForm({
                  ...schoolForm,
                  city: e.target.value,
                })
              }
            />

            <label>Téléphone</label>

            <input
              type="text"
              value={schoolForm.phone}
              onChange={(e) =>
                setSchoolForm({
                  ...schoolForm,
                  phone: e.target.value,
                })
              }
            />

            <label>E-mail</label>

            <input
              type="email"
              value={schoolForm.email}
              onChange={(e) =>
                setSchoolForm({
                  ...schoolForm,
                  email: e.target.value,
                })
              }
            />

            <button type="submit">
              {editingSchool
                ? "💾 Enregistrer"
                : "Créer l'école"}
            </button>
          </form>
        )}

        <div className="grid">
          {schools.map((school) => (
            <div
              className="stat"
              key={school.id}
            >
              <strong>
                🏫 {school.name}
              </strong>

              <span>
                {school.city ||
                  "Ville non renseignée"}
              </span>

              <button
                onClick={() =>
                  startEditSchool(
                    school
                  )
                }
              >
                ✏️ Modifier
              </button>

              <button
                onClick={() =>
                  deleteSchool(
                    school
                  )
                }
              >
                🗑️ Supprimer
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderClasses() {
    return (
      <>
        <div className="notice">
          <h2>📚 Gestion des classes</h2>

          <button
            onClick={() => {
              if (showClassForm) {
                resetClassForm();
              } else {
                setEditingClass(null);
                setClassForm({
                  school_id: "",
                  name: "",
                  level: "",
                });
                setShowClassForm(true);
              }
            }}
          >
            {showClassForm
              ? "Fermer"
              : "➕ Nouvelle classe"}
          </button>
        </div>

        {showClassForm && (
          <form
            className="notice"
            onSubmit={saveClass}
          >
            <h3>
              {editingClass
                ? "Modifier la classe"
                : "Nouvelle classe"}
            </h3>

            <label>École</label>

            <select
              value={classForm.school_id}
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  school_id: e.target.value,
                })
              }
              required
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
              type="text"
              placeholder="Ex : 4ème A"
              value={classForm.name}
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  name: e.target.value,
                })
              }
              required
            />

            <label>Niveau</label>

            <input
              type="text"
              placeholder="Ex : 4ème"
              value={classForm.level}
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  level: e.target.value,
                })
              }
            />

            <button type="submit">
              {editingClass
                ? "💾 Enregistrer"
                : "Créer la classe"}
            </button>
          </form>
        )}

        <div className="grid">
          {classes.map((classItem) => (
            <div
              className="stat"
              key={classItem.id}
            >
              <strong>
                📚 {classItem.name}
              </strong>

              <span>
                Niveau :{" "}
                {classItem.level ||
                  "Non renseigné"}
              </span>

              <span>
                🏫{" "}
                {getSchoolName(
                  classItem.school_id
                )}
              </span>

              <button
                onClick={() =>
                  startEditClass(
                    classItem
                  )
                }
              >
                ✏️ Modifier
              </button>

              <button
                onClick={() =>
                  deleteClass(
                    classItem
                  )
                }
              >
                🗑️ Supprimer
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderSubjects() {
    return (
      <>
        <div className="notice">
          <h2>📖 Gestion des matières</h2>

          <button
            onClick={() => {
              if (showSubjectForm) {
                resetSubjectForm();
              } else {
                setEditingSubject(null);
                setSubjectForm({
                  name: "",
                });
                setShowSubjectForm(true);
              }
            }}
          >
            {showSubjectForm
              ? "Fermer"
              : "➕ Nouvelle matière"}
          </button>
        </div>

        {showSubjectForm && (
          <form
            className="notice"
            onSubmit={saveSubject}
          >
            <h3>
              {editingSubject
                ? "Modifier la matière"
                : "Nouvelle matière"}
            </h3>

            <label>
              Nom de la matière
            </label>

            <input
              type="text"
              placeholder="Ex : Mathématiques"
              value={subjectForm.name}
              onChange={(e) =>
                setSubjectForm({
                  name: e.target.value,
                })
              }
              required
            />

            <button type="submit">
              {editingSubject
                ? "💾 Enregistrer"
                : "Créer la matière"}
            </button>
          </form>
        )}

        <div className="grid">
          {subjects.map((subject) => (
            <div
              className="stat"
              key={subject.id}
            >
              <strong>
                📖 {subject.name}
              </strong>

              <button
                onClick={() =>
                  startEditSubject(
                    subject
                  )
                }
              >
                ✏️ Modifier
              </button>

              <button
                onClick={() =>
                  deleteSubject(
                    subject
                  )
                }
              >
                🗑️ Supprimer
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderDocuments() {
    return (
      <>
        <div className="notice">
          <h2>
            📄 Tous les documents / leçons
          </h2>

          <p>
            Total : {documents.length}
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="notice">
            Aucun document publié.
          </div>
        ) : (
          <div className="grid">
            {documents.map((document) => (
              <div
                className="stat"
                key={document.id}
              >
                <strong>
                  📄 {document.title}
                </strong>

                <span>
                  Type :{" "}
                  {document.document_type}
                </span>

                <span>
                  👨‍🏫{" "}
                  {getTeacherName(
                    document.teacher_id
                  )}
                </span>

                <span>
                  📚{" "}
                  {getClassName(
                    document.class_id
                  )}
                </span>

                <span>
                  📖{" "}
                  {getSubjectName(
                    document.subject_id
                  )}
                </span>

                {document.description && (
                  <span>
                    {document.description}
                  </span>
                )}

                <span>
                  📅{" "}
                  {formatDate(
                    document.created_at
                  )}
                </span>

                {document.file_url && (
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📥 Ouvrir le document
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderExercises() {
    return (
      <>
        <div className="notice">
          <h2>📝 Tous les exercices</h2>

          <p>
            Total : {exercises.length}
          </p>
        </div>

        {exercises.length === 0 ? (
          <div className="notice">
            Aucun exercice trouvé.
          </div>
        ) : (
          <div className="grid">
            {exercises.map((exercise) => {
              const exerciseQuestions =
                questions.filter(
                  (question) =>
                    question.exercise_id ===
                    exercise.id
                );

              return (
                <div
                  className="stat"
                  key={exercise.id}
                >
                  <strong>
                    📝 {exercise.title}
                  </strong>

                  <span>
                    👨‍🏫{" "}
                    {getTeacherName(
                      exercise.teacher_id
                    )}
                  </span>

                  <span>
                    🏫{" "}
                    {getSchoolName(
                      exercise.school_id
                    )}
                  </span>

                  <span>
                    📚{" "}
                    {getClassName(
                      exercise.class_id
                    )}
                  </span>

                  <span>
                    📖{" "}
                    {getSubjectName(
                      exercise.subject_id
                    )}
                  </span>

                  <span>
                    Questions :{" "}
                    {exerciseQuestions.length}
                  </span>

                  <span>
                    Durée :{" "}
                    {exercise.duration_minutes ||
                      0}{" "}
                    min
                  </span>

                  <span>
                    Statut :{" "}
                    {exercise.published
                      ? "Publié"
                      : "Brouillon"}
                  </span>

                  {exercise.description && (
                    <span>
                      {exercise.description}
                    </span>
                  )}

                  {exercise.instructions && (
                    <span>
                      Instructions :{" "}
                      {exercise.instructions}
                    </span>
                  )}

                  <span>
                    📅{" "}
                    {formatDate(
                      exercise.created_at
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  function renderQuestions() {
    return (
      <>
        <div className="notice">
          <h2>❓ Questions des exercices</h2>

          <p>
            Total : {questions.length}
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="notice">
            Aucune question trouvée.
          </div>
        ) : (
          <div className="grid">
            {questions.map((question) => (
              <div
                className="stat"
                key={question.id}
              >
                <strong>
                  ❓ Question{" "}
                  {question.position || ""}
                </strong>

                <span>
                  Exercice :{" "}
                  {getExerciseName(
                    question.exercise_id
                  )}
                </span>

                <span>
                  {question.question}
                </span>

                <span>
                  Type :{" "}
                  {question.question_type}
                </span>

                <span>
                  Points :{" "}
                  {question.points || 0}
                </span>

                {question.correct_answer && (
                  <span>
                    Réponse correcte :{" "}
                    {question.correct_answer}
                  </span>
                )}

                {question.options && (
                  <span>
                    Options :{" "}
                    {JSON.stringify(
                      question.options
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderNotifications() {
    return (
      <>
        <div className="notice">
          <h2>
            🔔 Notifications / échanges
          </h2>

          <p>
            Total :{" "}
            {notifications.length}
          </p>
        </div>

        {notifications.length === 0 ? (
          <div className="notice">
            Aucune notification trouvée.
          </div>
        ) : (
          <div className="grid">
            {notifications.map(
              (notification) => (
                <div
                  className="stat"
                  key={notification.id}
                >
                  <strong>
                    🔔{" "}
                    {notification.title ||
                      "Notification"}
                  </strong>

                  <span>
                    Type :{" "}
                    {notification.type ||
                      "Non renseigné"}
                  </span>

                  <span>
                    Destinataire :{" "}
                    {notification.recipient_id ||
                      "Non renseigné"}
                  </span>

                  {notification.student_id && (
                    <span>
                      Élève :{" "}
                      {getStudentName(
                        notification.student_id
                      )}
                    </span>
                  )}

                  <span>
                    {notification.message ||
                      "Aucun message"}
                  </span>

                  <span>
                    État :{" "}
                    {notification.read
                      ? "Lu"
                      : "Non lu"}
                  </span>

                  <span>
                    📅{" "}
                    {formatDate(
                      notification.created_at
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </>
    );
  }
  function renderAdminControl() {
    return (
      <>
        <div className="notice">
          <h2>👑 Contrôle total</h2>

          <p>
            Vue globale de l'activité de tous les
            utilisateurs de l'application.
          </p>

          {adminControlLoading && (
            <p>⏳ Chargement des données...</p>
          )}
        </div>

        <div className="grid">
          <button
            onClick={() =>
              setAdminControlTab("documents")
            }
          >
            📄 Documents ({adminDocuments.length})
          </button>

          <button
            onClick={() =>
              setAdminControlTab("exercises")
            }
          >
            📝 Exercices ({adminExercises.length})
          </button>

          <button
            onClick={() =>
              setAdminControlTab("attendance")
            }
          >
            🕘 Présences ({adminAttendance.length})
          </button>

          <button
            onClick={() =>
              setAdminControlTab("notifications")
            }
          >
            🔔 Activités ({adminNotifications.length})
          </button>
        </div>

        {adminControlTab === "documents" && (
          <div className="notice">
            <h3>📄 Tous les documents</h3>

            {adminDocuments.length === 0 ? (
              <p>Aucun document trouvé.</p>
            ) : (
              <div className="grid">
                {adminDocuments.map((document) => (
                  <div
                    className="stat"
                    key={document.id}
                  >
                    <strong>
                      📄 {document.title}
                    </strong>

                    <span>
                      Type :{" "}
                      {document.document_type}
                    </span>

                    <span>
                      Professeur :{" "}
                      {getTeacherName(
                        document.teacher_id
                      )}
                    </span>

                    <span>
                      Classe :{" "}
                      {getClassName(
                        document.class_id
                      )}
                    </span>

                    <span>
                      Matière :{" "}
                      {getSubjectName(
                        document.subject_id
                      )}
                    </span>

                    <span>
                      📅{" "}
                      {formatDate(
                        document.created_at
                      )}
                    </span>

                    {document.file_url && (
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📥 Ouvrir le document
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminControlTab === "exercises" && (
          <div className="notice">
            <h3>📝 Tous les exercices</h3>

            {adminExercises.length === 0 ? (
              <p>Aucun exercice trouvé.</p>
            ) : (
              <div className="grid">
                {adminExercises.map((exercise) => (
                  <div
                    className="stat"
                    key={exercise.id}
                  >
                    <strong>
                      📝 {exercise.title}
                    </strong>

                    <span>
                      Professeur :{" "}
                      {getTeacherName(
                        exercise.teacher_id
                      )}
                    </span>

                    <span>
                      École :{" "}
                      {getSchoolName(
                        exercise.school_id
                      )}
                    </span>

                    <span>
                      Classe :{" "}
                      {getClassName(
                        exercise.class_id
                      )}
                    </span>

                    <span>
                      Matière :{" "}
                      {getSubjectName(
                        exercise.subject_id
                      )}
                    </span>

                    <span>
                      Statut :{" "}
                      {exercise.published
                        ? "Publié"
                        : "Brouillon"}
                    </span>

                    <span>
                      📅{" "}
                      {formatDate(
                        exercise.created_at
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminControlTab === "attendance" && (
          <div className="notice">
            <h3>🕘 Toutes les présences</h3>

            {adminAttendance.length === 0 ? (
              <p>
                Aucune présence enregistrée.
              </p>
            ) : (
              <div className="grid">
                {adminAttendance.map((attendance) => (
                  <div
                    className="stat"
                    key={attendance.id}
                  >
                    <strong>
                      👨‍🎓{" "}
                      {getStudentName(
                        attendance.student_id
                      )}
                    </strong>

                    <span>
                      📅 Date :{" "}
                      {attendance.date ||
                        "Non renseignée"}
                    </span>

                    <span>
                      🟢 Arrivée :{" "}
                      {attendance.arrival_time ||
                        "Non renseignée"}
                    </span>

                    <span>
                      🔴 Départ :{" "}
                      {attendance.departure_time ||
                        "Non renseigné"}
                    </span>

                    <span>
                      Statut :{" "}
                      {attendance.status ||
                        "Non renseigné"}
                    </span>

                    <span>
                      Enregistré par :{" "}
                      {attendance.recorded_by ||
                        "Non renseigné"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminControlTab === "notifications" && (
          <div className="notice">
            <h3>🔔 Activités / notifications</h3>

            {adminNotifications.length === 0 ? (
              <p>
                Aucune activité trouvée.
              </p>
            ) : (
              <div className="grid">
                {adminNotifications.map(
                  (notification) => (
                    <div
                      className="stat"
                      key={notification.id}
                    >
                      <strong>
                        🔔{" "}
                        {notification.title ||
                          "Notification"}
                      </strong>

                      <span>
                        Type :{" "}
                        {notification.type ||
                          "Non renseigné"}
                      </span>

                      <span>
                        Destinataire :{" "}
                        {notification.recipient_id ||
                          "Non renseigné"}
                      </span>

                      {notification.student_id && (
                        <span>
                          Élève :{" "}
                          {getStudentName(
                            notification.student_id
                          )}
                        </span>
                      )}

                      <span>
                        {notification.message ||
                          "Aucun message"}
                      </span>

                      <span>
                        État :{" "}
                        {notification.read
                          ? "Lu"
                          : "Non lu"}
                      </span>

                      <span>
                        📅{" "}
                        {formatDate(
                          notification.created_at
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </>
    );
  }
  function renderActiveSection() {
    switch (activeSection) {
      case "teachers":
        return renderTeachers();

      case "students":
        return renderStudents();

      case "parents":
        return renderParents();

      case "schools":
        return renderSchools();

      case "classes":
        return renderClasses();

      case "subjects":
        return renderSubjects();

      case "documents":
        return renderDocuments();

      case "exercises":
        return renderExercises();

      case "questions":
        return renderQuestions();

      case "notifications":
        return renderNotifications();
   
      case "admin-control":
       return renderAdminControl();

      default:
        return renderDashboard();
    }
  }

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

        {renderNavigation()}

        {activeSection !== "dashboard" && (
          <div className="notice">
            <button
              className="secondary"
              onClick={() =>
                openSection("dashboard")
              }
            >
              ← Retour au tableau de bord
            </button>
          </div>
        )}

        {renderActiveSection()}
      </section>
    </main>
  );
}
