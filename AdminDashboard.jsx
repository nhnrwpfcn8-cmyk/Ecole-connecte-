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
  });

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [parentStudents, setParentStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
        parentStudentsResult,
        schoolsResult,
        classesResult,
        subjectsResult,
        documentsResult,
      ] = await Promise.all([
        // PROFESSEURS
        supabase
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("role", "teacher")
          .order("full_name"),

        // ÉLÈVES
        supabase
          .from("students")
          .select(
            "id, first_name, last_name, school_id, class_id, student_code, active"
          )
          .order("last_name"),

        // PARENTS
        supabase
          .from("profiles")
          .select("id, full_name, phone, role")
          .eq("role", "parent")
          .order("full_name"),

        // RELATIONS PARENTS / ÉLÈVES
        supabase
          .from("parent_students")
          .select(
            "parent_id, student_id, relationship"
          ),

        // ÉCOLES
        supabase
          .from("schools")
          .select(
            "id, name, address, city, phone, email"
          )
          .order("name"),

        // CLASSES
        supabase
          .from("classes")
          .select(
            "id, school_id, name, level, created_at"
          )
          .order("name", {
            ascending: true,
          }),

        // MATIÈRES
        supabase
          .from("subjects")
          .select("id, name")
          .order("name"),

        // DOCUMENTS
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
          .order("created_at", {
            ascending: false,
          }),
      ]);

      const errors = [
        teachersResult.error,
        studentsResult.error,
        parentsResult.error,
        parentStudentsResult.error,
        schoolsResult.error,
        classesResult.error,
        subjectsResult.error,
        documentsResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw errors[0];
      }

      // PROFESSEURS
      setTeachers(
        teachersResult.data || []
      );

      // ÉLÈVES
      setStudents(
        studentsResult.data || []
      );

      // PARENTS
      setParents(
        parentsResult.data || []
      );

      // RELATIONS PARENTS / ÉLÈVES
      setParentStudents(
        parentStudentsResult.data || []
      );

      // ÉCOLES
      setSchools(
        schoolsResult.data || []
      );

      // CLASSES
      const loadedClasses = (
        classesResult.data || []
      ).map((item) => ({
        ...item,
        id: String(item.id),
        school_id: item.school_id
          ? String(item.school_id)
          : "",
      }));

      setClasses(loadedClasses);

      // MATIÈRES
      setSubjects(
        subjectsResult.data || []
      );

      // DOCUMENTS
      setDocuments(
        documentsResult.data || []
      );

      // STATISTIQUES
      setStats({
        teachers:
          teachersResult.data?.length || 0,

        students:
          studentsResult.data?.length || 0,

        parents:
          parentsResult.data?.length || 0,

        schools:
          schoolsResult.data?.length || 0,

        classes:
          classesResult.data?.length || 0,

        subjects:
          subjectsResult.data?.length || 0,

        documents:
          documentsResult.data?.length || 0,
      });
    } catch (error) {
      console.error(
        "Erreur loadData :",
        error
      );

      setMessage(
        "Impossible de charger les données : " +
          error.message
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // PROFESSEURS
  // =========================================================

  async function createTeacher(e) {
    e.preventDefault();
    setMessage("");

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "create-user",
          {
            body: {
              full_name:
                teacherForm.full_name,
              email:
                teacherForm.email,
              phone:
                teacherForm.phone,
              role: "teacher",
            },
          }
        );

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Impossible de créer le professeur."
        );
      }

      setMessage(
        "Professeur créé avec succès."
      );

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
          error.message
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
          full_name:
            teacherForm.full_name,
          phone:
            teacherForm.phone,
        })
        .eq(
          "id",
          editingTeacher.id
        );

      if (error) {
        throw error;
      }

      setMessage(
        "Professeur modifié avec succès."
      );

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

  async function toggleTeacher(
    teacher
  ) {
    setMessage("");

    try {
      /*
       * On utilise le champ role existant.
       * Si le professeur est teacher,
       * on le désactive en passant role à inactive.
       */
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

      if (error) {
        throw error;
      }

      setMessage(
        newRole === "teacher"
          ? "Professeur réactivé."
          : "Professeur désactivé."
      );

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur : " +
          error.message
      );
    }
  }

  function startEditTeacher(
    teacher
  ) {
    setEditingTeacher(teacher);

    setTeacherForm({
      full_name:
        teacher.full_name || "",
      email: "",
      phone:
        teacher.phone || "",
    });

    setShowTeacherForm(true);
  }

  // =========================================================
  // ÉCOLES
  // =========================================================

  async function saveSchool(e) {
    e.preventDefault();
    setMessage("");

    try {
      if (editingSchool) {
        const { error } =
          await supabase
            .from("schools")
            .update(schoolForm)
            .eq(
              "id",
              editingSchool.id
            );

        if (error) {
          throw error;
        }

        setMessage(
          "École modifiée avec succès."
        );
      } else {
        const { error } =
          await supabase
            .from("schools")
            .insert([
              schoolForm,
            ]);

        if (error) {
          throw error;
        }

        setMessage(
          "École créée avec succès."
        );
      }

      setSchoolForm({
        name: "",
        address: "",
        city: "",
        phone: "",
        email: "",
      });

      setEditingSchool(null);
      setShowSchoolForm(false);

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur école : " +
          error.message
      );
    }
  }

  async function deleteSchool(
    school
  ) {
    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer cette école ?"
      );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("schools")
          .delete()
          .eq("id", school.id);

      if (error) {
        throw error;
      }

      setMessage(
        "École supprimée."
      );

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur suppression école : " +
          error.message
      );
    }
  }

  function startEditSchool(
    school
  ) {
    setEditingSchool(school);

    setSchoolForm({
      name:
        school.name || "",
      address:
        school.address || "",
      city:
        school.city || "",
      phone:
        school.phone || "",
      email:
        school.email || "",
    });

    setShowSchoolForm(true);
  }

  // =========================================================
  // CLASSES
  // =========================================================

  async function saveClass(e) {
    e.preventDefault();
    setMessage("");

    if (!classForm.school_id) {
      setMessage(
        "Veuillez choisir une école."
      );
      return;
    }

    if (!classForm.name.trim()) {
      setMessage(
        "Veuillez saisir le nom de la classe."
      );
      return;
    }

    try {
      if (editingClass) {
        const { error } =
          await supabase
            .from("classes")
            .update({
              school_id:
                classForm.school_id,
              name:
                classForm.name.trim(),
              level:
                classForm.level.trim() ||
                null,
            })
            .eq(
              "id",
              editingClass.id
            );

        if (error) {
          throw error;
        }

        setMessage(
          "Classe modifiée avec succès."
        );
      } else {
        const { error } =
          await supabase
            .from("classes")
            .insert([
              {
                school_id:
                  classForm.school_id,
                name:
                  classForm.name.trim(),
                level:
                  classForm.level.trim() ||
                  null,
              },
            ]);

        if (error) {
          throw error;
        }

        setMessage(
          "Classe créée avec succès."
        );
      }

      setClassForm({
        school_id: "",
        name: "",
        level: "",
      });

      setEditingClass(null);
      setShowClassForm(false);

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur classe : " +
          error.message
      );
    }
  }

  async function deleteClass(
    classItem
  ) {
    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer cette classe ?"
      );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("classes")
          .delete()
          .eq(
            "id",
            classItem.id
          );

      if (error) {
        throw error;
      }

      setMessage(
        "Classe supprimée."
      );

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur suppression classe : " +
          error.message
      );
    }
  }

  function startEditClass(
    classItem
  ) {
    setEditingClass(classItem);

    setClassForm({
      school_id:
        classItem.school_id || "",
      name:
        classItem.name || "",
      level:
        classItem.level || "",
    });

    setShowClassForm(true);
  }

  // =========================================================
  // MATIÈRES
  // =========================================================

  async function saveSubject(e) {
    e.preventDefault();
    setMessage("");

    const name =
      subjectForm.name.trim();

    if (!name) {
      setMessage(
        "Veuillez saisir le nom de la matière."
      );
      return;
    }

    try {
      if (editingSubject) {
        const { error } =
          await supabase
            .from("subjects")
            .update({
              name: name,
            })
            .eq(
              "id",
              editingSubject.id
            );

        if (error) {
          throw error;
        }

        setMessage(
          "Matière modifiée avec succès."
        );
      } else {
        const { error } =
          await supabase
            .from("subjects")
            .insert([
              {
                name: name,
              },
            ]);

        if (error) {
          throw error;
        }

        setMessage(
          "Matière créée avec succès."
        );
      }

      setSubjectForm({
        name: "",
      });

      setEditingSubject(null);
      setShowSubjectForm(false);

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur matière : " +
          error.message
      );
    }
  }

  async function deleteSubject(
    subject
  ) {
    const confirmed =
      window.confirm(
        "Voulez-vous vraiment supprimer cette matière ?"
      );

    if (!confirmed) return;

    try {
      const { error } =
        await supabase
          .from("subjects")
          .delete()
          .eq(
            "id",
            subject.id
          );

      if (error) {
        throw error;
      }

      setMessage(
        "Matière supprimée."
      );

      await loadData();
    } catch (error) {
      setMessage(
        "Erreur suppression matière : " +
          error.message
      );
    }
  }

  function startEditSubject(
    subject
  ) {
    setEditingSubject(subject);

    setSubjectForm({
      name:
        subject.name || "",
    });

    setShowSubjectForm(true);
  }

  // =========================================================
  // FONCTIONS D'AFFICHAGE
  // =========================================================

  function getSchoolName(
    schoolId
  ) {
    const school =
      schools.find(
        (item) =>
          String(item.id) ===
          String(schoolId)
      );

    return (
      school?.name ||
      "École inconnue"
    );
  }

  function getTeacherName(
    teacherId
  ) {
    const teacher =
      teachers.find(
        (item) =>
          String(item.id) ===
          String(teacherId)
      );

    return (
      teacher?.full_name ||
      "Professeur inconnu"
    );
  }

  function getClassName(
    classId
  ) {
    const classItem =
      classes.find(
        (item) =>
          String(item.id) ===
          String(classId)
      );

    return (
      classItem?.name ||
      "Classe inconnue"
    );
  }

  function getSubjectName(
    subjectId
  ) {
    const subject =
      subjects.find(
        (item) =>
          String(item.id) ===
          String(subjectId)
      );

    return (
      subject?.name ||
      "Matière inconnue"
    );
  }

  function getStudentName(
    studentId
  ) {
    const student =
      students.find(
        (item) =>
          String(item.id) ===
          String(studentId)
      );

    if (!student) {
      return "Élève inconnu";
    }

    const name =
      `${student.first_name || ""} ${
        student.last_name || ""
      }`.trim();

    return (
      name ||
      "Élève sans nom"
    );
  }

  function getParentStudents(
    parentId
  ) {
    return parentStudents.filter(
      (item) =>
        String(item.parent_id) ===
        String(parentId)
    );
  }

  // =========================================================
  // AFFICHAGE
  // =========================================================

  if (loading) {
    return (
      <div className="center">
        Chargement de
        l'administration…
      </div>
    );
  }

  return (
    <main className="page">
      <section className="card dashboard">

        {/* =====================================================
            EN-TÊTE
        ====================================================== */}

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

        {/* =====================================================
            STATISTIQUES
        ====================================================== */}

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

          <div className="stat">
            <strong>
              {stats.documents}
            </strong>
            <span>
              Documents
            </span>
          </div>

        </div>

        {/* =====================================================
            PROFESSEURS
        ====================================================== */}

        <div className="notice">
          <h2>
            👨‍🏫 Gestion des professeurs
          </h2>

          <button
            onClick={() => {
              setEditingTeacher(null);

              setTeacherForm({
                full_name: "",
                email: "",
                phone: "",
              });

              setShowTeacherForm(
                !showTeacherForm
              );
            }}
          >
            ➕ Nouveau professeur
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

            <label>
              Nom complet
            </label>

            <input
              type="text"
              placeholder="Ex : Mamadou Diop"
              value={
                teacherForm.full_name
              }
              onChange={(e) =>
                setTeacherForm({
                  ...teacherForm,
                  full_name:
                    e.target.value,
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
                  value={
                    teacherForm.email
                  }
                  onChange={(e) =>
                    setTeacherForm({
                      ...teacherForm,
                      email:
                        e.target.value,
                    })
                  }
                  required
                />
              </>
            )}

            <label>
              Téléphone
            </label>

            <input
              type="text"
              placeholder="77 000 00 00"
              value={
                teacherForm.phone
              }
              onChange={(e) =>
                setTeacherForm({
                  ...teacherForm,
                  phone:
                    e.target.value,
                })
              }
            />

            <button type="submit">
              {editingTeacher
                ? "💾 Enregistrer"
                : "Créer le professeur"}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditingTeacher(null);
                setShowTeacherForm(false);
              }}
            >
              Annuler
            </button>
          </form>
        )}

        <div className="grid">
          {teachers.length === 0 ? (
            <div className="notice">
              Aucun professeur trouvé.
            </div>
          ) : (
            teachers.map(
              (teacher) => (
                <div
                  className="stat"
                  key={teacher.id}
                >
                  <strong>
                    👨‍🏫{" "}
                    {teacher.full_name ||
                      "Sans nom"}
                  </strong>

                  <span>
                    📞{" "}
                    {teacher.phone ||
                      "Téléphone non renseigné"}
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
                    {teacher.role ===
                    "teacher"
                      ? "🚫 Désactiver"
                      : "✅ Réactiver"}
                  </button>
                </div>
              )
            )
          )}
        </div>

        {/* =====================================================
            PARENTS
        ====================================================== */}

        <div className="notice">
          <h2>
            👪 Gestion des parents
          </h2>

          <p>
            Total : {parents.length}
          </p>

          <p>
            Les parents sont associés aux
            élèves grâce à la table
            <strong>
              {" "}
              parent_students
            </strong>.
          </p>
        </div>

        {parents.length === 0 ? (
          <div className="notice">
            Aucun parent trouvé.
          </div>
        ) : (
          <div className="grid">
            {parents.map(
              (parent) => {
                const linkedStudents =
                  getParentStudents(
                    parent.id
                  );

                return (
                  <div
                    className="stat"
                    key={parent.id}
                  >
                    <strong>
                      👪{" "}
                      {parent.full_name ||
                        "Parent sans nom"}
                    </strong>

                    <span>
                      📞{" "}
                      {parent.phone ||
                        "Téléphone non renseigné"}
                    </span>

                    <span>
                      👤 Rôle : parent
                    </span>

                    <span>
                      👨‍🎓 Élèves associés :{" "}
                      {
                        linkedStudents.length
                      }
                    </span>

                    {linkedStudents.length ===
                    0 ? (
                      <span>
                        Aucun élève associé.
                      </span>
                    ) : (
                      linkedStudents.map(
                        (relation) => (
                          <span
                            key={`${relation.parent_id}-${relation.student_id}`}
                          >
                            👨‍🎓{" "}
                            {getStudentName(
                              relation.student_id
                            )}

                            {" — "}

                            {relation.relationship ||
                              "Parent"}
                          </span>
                        )
                      )
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* =====================================================
            ÉCOLES
        ====================================================== */}

        <div className="notice">
          <h2>
            🏫 Gestion des écoles
          </h2>

          <button
            onClick={() => {
              setEditingSchool(null);

              setSchoolForm({
                name: "",
                address: "",
                city: "",
                phone: "",
                email: "",
              });

              setShowSchoolForm(
                !showSchoolForm
              );
            }}
          >
            ➕ Nouvelle école
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

            <label>
              Nom de l'école
            </label>

            <input
              type="text"
              placeholder="Ex : École Connectée"
              value={
                schoolForm.name
              }
              onChange={(e) =>
                setSchoolForm({
                  ...schoolForm,
                  name:
                    e.target.value,
                })
              }
              required
            />

            <label>
              Adresse
            </label>

            <input
              type="text"
              placeholder="Adresse"
              value={
                schoolForm.address
              }
              onChange={(e) =>
                setSchoolForm({
                  ...schoolForm,
                  address:
                    e.target.value,
                })
              }
            />

            <label>
              Ville
            </label>

            <input
              type="text"
              placeholder="Dakar"
              value={
                schoolForm.city
              }
              onChange={(e) =>
                setSchoolForm({
                  ...schoolForm,
                  city:
                    e.target.value,
                })
              }
            />

            <label>
              Téléphone
            </label>

            <input
              type="text"
              placeholder="77 000 00 00"
              value={
                schoolForm.phone
              }
              onChange={(e) =>
                setSchoolForm({
                  ...schoolForm,
                  phone:
                    e.target.value,
                })
              }
            />

            <label>
              E-mail
            </label>

            <input
              type="email"
              placeholder="ecole@email.com"
              value={
                schoolForm.email
              }
              onChange={(e) =>
                setSchoolForm({
                  ...schoolForm,
                  email:
                    e.target.value,
                })
              }
            />

            <button type="submit">
              {editingSchool
                ? "💾 Enregistrer"
                : "Créer l'école"}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditingSchool(null);
                setShowSchoolForm(false);
              }}
            >
              Annuler
            </button>
          </form>
        )}

        <div className="grid">
          {schools.length === 0 ? (
            <div className="notice">
              Aucune école.
            </div>
          ) : (
            schools.map(
              (school) => (
                <div
                  className="stat"
                  key={school.id}
                >
                  <strong>
                    🏫{" "}
                    {school.name}
                  </strong>

                  <span>
                    📍{" "}
                    {school.city ||
                      "Ville non renseignée"}
                  </span>

                  <span>
                    {school.address ||
                      "Adresse non renseignée"}
                  </span>

                  <span>
                    📞{" "}
                    {school.phone ||
                      "Téléphone non renseigné"}
                  </span>

                  <span>
                    ✉️{" "}
                    {school.email ||
                      "E-mail non renseigné"}
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
              )
            )
          )}
        </div>

        {/* =====================================================
            CLASSES
        ====================================================== */}

        <div className="notice">
          <h2>
            📚 Gestion des classes
          </h2>

          <p>
            Total : {classes.length}
          </p>

          <button
            onClick={() => {
              setEditingClass(null);

              setClassForm({
                school_id: "",
                name: "",
                level: "",
              });

              setShowClassForm(
                !showClassForm
              );
            }}
          >
            ➕ Nouvelle classe
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

            <label>
              École
            </label>

            <select
              value={
                classForm.school_id
              }
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  school_id:
                    e.target.value,
                })
              }
              required
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
              Nom de la classe
            </label>

            <input
              type="text"
              placeholder="Ex : 4ème A"
              value={
                classForm.name
              }
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  name:
                    e.target.value,
                })
              }
              required
            />

            <label>
              Niveau
            </label>

            <input
              type="text"
              placeholder="Ex : 4ème"
              value={
                classForm.level
              }
              onChange={(e) =>
                setClassForm({
                  ...classForm,
                  level:
                    e.target.value,
                })
              }
            />

            <button type="submit">
              {editingClass
                ? "💾 Enregistrer"
                : "Créer la classe"}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditingClass(null);
                setShowClassForm(false);
              }}
            >
              Annuler
            </button>
          </form>
        )}

        {classes.length === 0 ? (
          <div className="notice">
            Aucune classe trouvée.
          </div>
        ) : (
          <div className="grid">
            {classes.map(
              (classItem) => (
                <div
                  className="stat"
                  key={classItem.id}
                >
                  <strong>
                    📚{" "}
                    {classItem.name}
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
              )
            )}
          </div>
        )}

        {/* =====================================================
            MATIÈRES
        ====================================================== */}

        <div className="notice">
          <h2>
            📖 Gestion des matières
          </h2>

          <button
            onClick={() => {
              setEditingSubject(null);

              setSubjectForm({
                name: "",
              });

              setShowSubjectForm(
                !showSubjectForm
              );
            }}
          >
            ➕ Nouvelle matière
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
              value={
                subjectForm.name
              }
              onChange={(e) =>
                setSubjectForm({
                  name:
                    e.target.value,
                })
              }
              required
            />

            <button type="submit">
              {editingSubject
                ? "💾 Enregistrer"
                : "Créer la matière"}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditingSubject(null);
                setShowSubjectForm(false);
              }}
            >
              Annuler
            </button>
          </form>
        )}

        <div className="grid">
          {subjects.length === 0 ? (
            <div className="notice">
              Aucune matière.
            </div>
          ) : (
            subjects.map(
              (subject) => (
                <div
                  className="stat"
                  key={subject.id}
                >
                  <strong>
                    📖{" "}
                    {subject.name}
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
              )
            )
          )}
        </div>

        {/* =====================================================
            DOCUMENTS / LEÇONS
        ====================================================== */}

        <div className="notice">
          <h2>
            📖 Tous les documents et leçons
          </h2>

          <p>
            Vue globale des documents
            publiés par les professeurs.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="notice">
            <p>
              Aucun document n'a encore
              été publié.
            </p>
          </div>
        ) : (
          <div className="grid">
            {documents.map(
              (document) => (
                <div
                  className="stat"
                  key={document.id}
                >
                  <strong>
                    📄{" "}
                    {document.title}
                  </strong>

                  <span>
                    Type :{" "}
                    {
                      document.document_type
                    }
                  </span>

                  <span>
                    👨‍🏫 Professeur :{" "}
                    {getTeacherName(
                      document.teacher_id
                    )}
                  </span>

                  <span>
                    🏫 Classe :{" "}
                    {getClassName(
                      document.class_id
                    )}
                  </span>

                  <span>
                    📖 Matière :{" "}
                    {getSubjectName(
                      document.subject_id
                    )}
                  </span>

                  {document.description && (
                    <span>
                      📝{" "}
                      {
                        document.description
                      }
                    </span>
                  )}

                  {document.file_url && (
                    <a
                      href={
                        document.file_url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      📂 Ouvrir le document
                    </a>
                  )}

                  <span>
                    📅{" "}
                    {document.created_at
                      ? new Date(
                          document.created_at
                        ).toLocaleDateString(
                          "fr-FR"
                        )
                      : "Date inconnue"}
                  </span>
                </div>
              )
            )}
          </div>
        )}

      </section>
    </main>
  );
}
