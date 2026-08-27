import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "./src/lib/supabase";

export default function AdminDashboard({
  session,
  onLogout,
}) {
  // =========================================================
  // ÉTATS
  // =========================================================

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
  const [parentStudents, setParentStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [adminDocuments, setAdminDocuments] = useState([]);
  const [adminExercises, setAdminExercises] = useState([]);
  const [adminAttendance, setAdminAttendance] = useState([]);
  const [adminNotifications, setAdminNotifications] =
    useState([]);

  const [adminControlLoading, setAdminControlLoading] =
    useState(false);

  const [adminControlTab, setAdminControlTab] =
    useState("documents");

  const [activeSection, setActiveSection] =
    useState("dashboard");

  const [showTeacherForm, setShowTeacherForm] =
    useState(false);

  const [showStudentForm, setShowStudentForm] =
    useState(false);

  const [showSchoolForm, setShowSchoolForm] =
    useState(false);

  const [showClassForm, setShowClassForm] =
    useState(false);

  const [showSubjectForm, setShowSubjectForm] =
    useState(false);

  const [editingTeacher, setEditingTeacher] =
    useState(null);

  const [editingStudent, setEditingStudent] =
    useState(null);

  const [editingSchool, setEditingSchool] =
    useState(null);

  const [editingClass, setEditingClass] =
    useState(null);

  const [editingSubject, setEditingSubject] =
    useState(null);

  const [teacherForm, setTeacherForm] = useState({
  full_name: "",
  email: "",
  phone: "",
  password: "",
  school_id: "",
});

  const [studentForm, setStudentForm] = useState({
    school_id: "",
    class_id: "",
    first_name: "",
    last_name: "",
    student_code: "",
    photo_url: "",
    active: true,
    parent_id: "",
    relationship: "Parent",
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

  // =========================================================
  // INITIALISATION
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // HELPERS SUPABASE
  // =========================================================

  async function loadProfilesByRole(role) {
    /*
      On essaie d'abord avec active.
      Si la colonne active n'existe pas dans profiles,
      on recharge sans active.

      Cela évite que le tableau de bord plante simplement
      parce que profiles.active n'est pas présente.
    */

    let result = await supabase
      .from("profiles")
      .select(
        "id, full_name, phone, role, school_id, active"
      )
      .eq("role", role)
      .order("full_name");

    if (
      result.error &&
      result.error.message
        ?.toLowerCase()
        .includes("active")
    ) {
      result = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, role, school_id"
        )
        .eq("role", role)
        .order("full_name");
    }

    return result;
  }

  function showError(prefix, error) {
    console.error(prefix, error);

    setMessage(
      `❌ ${prefix} : ${
        error?.message || "Erreur inconnue"
      }`
    );
  }

  function formatDate(date) {
    if (!date) return "Non renseignée";

    try {
      return new Date(date).toLocaleString("fr-FR");
    } catch {
      return String(date);
    }
  }

  // =========================================================
  // CHARGEMENT PRINCIPAL
  // =========================================================

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
        exercisesResult,
        questionsResult,
        notificationsResult,
      ] = await Promise.all([
        loadProfilesByRole("teacher"),

        supabase
          .from("students")
          .select(
            `
              id,
              school_id,
              class_id,
              first_name,
              last_name,
              student_code,
              photo_url,
              active,
              created_at
            `
          )
          .order("last_name"),

        loadProfilesByRole("parent"),

        supabase
          .from("parent_students")
          .select(
            `
              parent_id,
              student_id,
              relationship,
              created_at
            `
          ),

        supabase
          .from("schools")
          .select(
            `
              id,
              name,
              address,
              city,
              phone,
              email,
              created_at
            `
          )
          .order("name"),

        supabase
          .from("classes")
          .select(
            `
              id,
              school_id,
              name,
              level,
              created_at
            `
          )
          .order("name"),

        supabase
          .from("subjects")
          .select(
            `
              id,
              name
            `
          )
          .order("name"),

        supabase
          .from("documents")
          .select(
            `
              id,
              teacher_id,
              class_id,
              subject_id,
              title,
              description,
              document_type,
              file_url,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("exercises")
          .select(
            `
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
            `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("exercise_questions")
          .select(
            `
              id,
              exercise_id,
              question,
              question_type,
              options,
              correct_answer,
              points,
              position,
              created_at
            `
          )
          .order("position"),

        supabase
          .from("notifications")
          .select(
            `
              id,
              recipient_id,
              student_id,
              type,
              title,
              message,
              read,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          }),
      ]);

      /*
        Les cinq éléments principaux sont nécessaires.
      */

      const requiredErrors = [
        teachersResult.error,
        studentsResult.error,
        schoolsResult.error,
        classesResult.error,
        subjectsResult.error,
      ].filter(Boolean);

      if (requiredErrors.length > 0) {
        throw requiredErrors[0];
      }

      /*
        Les modules secondaires ne doivent pas bloquer
        l'administration.
      */

      if (parentsResult.error) {
        console.warn(
          "Parents :",
          parentsResult.error.message
        );
      }

      if (parentStudentsResult.error) {
        console.warn(
          "Relations parent/élève :",
          parentStudentsResult.error.message
        );
      }

      if (documentsResult.error) {
        console.warn(
          "Documents :",
          documentsResult.error.message
        );
      }

      if (exercisesResult.error) {
        console.warn(
          "Exercices :",
          exercisesResult.error.message
        );
      }

      if (questionsResult.error) {
        console.warn(
          "Questions :",
          questionsResult.error.message
        );
      }

      if (notificationsResult.error) {
        console.warn(
          "Notifications :",
          notificationsResult.error.message
        );
      }

      const teacherData =
        teachersResult.data || [];

      const studentData =
        studentsResult.data || [];

      const parentData =
        parentsResult.data || [];

      const parentStudentData =
        parentStudentsResult.data || [];

      const schoolData =
        schoolsResult.data || [];

      const classData =
        classesResult.data || [];

      const subjectData =
        subjectsResult.data || [];

      const documentData =
        documentsResult.data || [];

      const exerciseData =
        exercisesResult.data || [];

      const questionData =
        questionsResult.data || [];

      const notificationData =
        notificationsResult.data || [];

      setTeachers(teacherData);
      setStudents(studentData);
      setParents(parentData);
      setParentStudents(parentStudentData);
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
        notifications:
          notificationData.length,
      });
    } catch (error) {
      console.error(
        "Erreur chargement administration :",
        error
      );

      setMessage(
        "❌ Impossible de charger les données : " +
          (error?.message ||
            "Erreur inconnue")
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // CONTRÔLE TOTAL
  // =========================================================

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
          .select(
            `
              id,
              teacher_id,
              class_id,
              subject_id,
              title,
              description,
              document_type,
              file_url,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("exercises")
          .select(
            `
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
            `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("attendance")
          .select(
            `
              id,
              student_id,
              date,
              arrival_time,
              departure_time,
              status,
              recorded_by,
              created_at
            `
          )
          .order("date", {
            ascending: false,
          }),

        supabase
          .from("notifications")
          .select(
            `
              id,
              recipient_id,
              student_id,
              type,
              title,
              message,
              read,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (documentsResult.error) {
        console.warn(
          "Documents contrôle :",
          documentsResult.error.message
        );
      }

      if (exercisesResult.error) {
        console.warn(
          "Exercices contrôle :",
          exercisesResult.error.message
        );
      }

      if (attendanceResult.error) {
        console.warn(
          "Présences contrôle :",
          attendanceResult.error.message
        );
      }

      if (notificationsResult.error) {
        console.warn(
          "Notifications contrôle :",
          notificationsResult.error.message
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

      setMessage(
        "❌ Erreur du contrôle total : " +
          (error?.message || "Erreur inconnue")
      );
    } finally {
      setAdminControlLoading(false);
    }
  }

  // =========================================================
  // PROFESSEURS
  // =========================================================

  async function createTeacher(e) {
    e.preventDefault();
    setMessage("");

    const fullName =
      teacherForm.full_name.trim();

    const email =
      teacherForm.email.trim();

    if (!fullName) {
      setMessage(
        "Veuillez saisir le nom du professeur."
      );
      return;
    }

    if (!email) {
      setMessage(
        "Veuillez saisir l'adresse e-mail."
      );
      return;
    }
if (!teacherForm.password) {
  setMessage(
    "Veuillez saisir un mot de passe."
  );
  return;
}

if (teacherForm.password.length < 6) {
  setMessage(
    "Le mot de passe doit contenir au moins 6 caractères."
  );
  return;
}
    if (!teacherForm.school_id) {
      setMessage(
        "Veuillez sélectionner une école."
      );
      return;
    }

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "create-user",
          {
            body: {
              full_name: fullName,
              email,
              phone:
                teacherForm.phone.trim() ||
                null,
              role: "teacher",
              school_id:
                teacherForm.school_id,
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
        "✅ Professeur créé avec succès."
      );

      resetTeacherForm();
      await loadData();
    } catch (error) {
      showError(
        "Erreur création professeur",
        error
      );
    }
  }

  async function updateTeacher(e) {
    e.preventDefault();
    setMessage("");

    if (!editingTeacher?.id) {
      setMessage(
        "Professeur introuvable."
      );
      return;
    }

    try {
      const values = {
        full_name:
          teacherForm.full_name.trim(),
        phone:
          teacherForm.phone.trim() ||
          null,
        school_id:
          teacherForm.school_id || null,
      };

      const { error } =
        await supabase
          .from("profiles")
          .update(values)
          .eq("id", editingTeacher.id);

      if (error) {
        throw error;
      }

      setMessage(
        "✅ Professeur modifié avec succès."
      );

      resetTeacherForm();
      await loadData();
    } catch (error) {
      showError(
        "Erreur modification professeur",
        error
      );
    }
  }

  async function toggleTeacher(teacher) {
    setMessage("");

    /*
      Si profiles.active n'existe pas,
      Supabase renverra une erreur claire.
    */

    const newActive =
      teacher.active === false;

    try {
      const { error } =
        await supabase
          .from("profiles")
          .update({
            active: newActive,
          })
          .eq("id", teacher.id);

      if (error) {
        throw error;
      }

      setMessage(
        newActive
          ? "✅ Professeur réactivé."
          : "🚫 Professeur désactivé."
      );

      await loadData();
    } catch (error) {
      showError(
        "Erreur statut professeur",
        error
      );
    }
  }

  // =========================================================
  // ÉLÈVES
  // =========================================================

  async function saveStudent(e) {
    e.preventDefault();
    setMessage("");

    if (!studentForm.school_id) {
      setMessage(
        "Veuillez choisir une école."
      );
      return;
    }

    if (!studentForm.first_name.trim()) {
      setMessage(
        "Veuillez saisir le prénom."
      );
      return;
    }

    if (!studentForm.last_name.trim()) {
      setMessage(
        "Veuillez saisir le nom."
      );
      return;
    }

    try {
      const values = {
        school_id:
          studentForm.school_id,

        class_id:
          studentForm.class_id || null,

        first_name:
          studentForm.first_name.trim(),

        last_name:
          studentForm.last_name.trim(),

        student_code:
          studentForm.student_code.trim() ||
          null,

        photo_url:
          studentForm.photo_url.trim() ||
          null,

        active:
          studentForm.active !== false,
      };

      let studentId =
        editingStudent?.id || null;

      if (editingStudent) {
        const { error } =
          await supabase
            .from("students")
            .update(values)
            .eq(
              "id",
              editingStudent.id
            );

        if (error) {
          throw error;
        }

        setMessage(
          "✅ Élève modifié avec succès."
        );
      } else {
        const {
          data,
          error,
        } = await supabase
          .from("students")
          .insert([values])
          .select(
            "id, school_id, class_id, first_name, last_name, student_code, photo_url, active, created_at"
          )
          .single();

        if (error) {
          throw error;
        }

        studentId = data.id;

        setMessage(
          "✅ Élève créé avec succès."
        );
      }

      /*
        Mise à jour du lien parent/élève.
      */

      if (studentId) {
        const {
          error: deleteError,
        } = await supabase
          .from("parent_students")
          .delete()
          .eq(
            "student_id",
            studentId
          );

        if (deleteError) {
          throw deleteError;
        }

        if (studentForm.parent_id) {
          const {
            error: parentError,
          } = await supabase
            .from("parent_students")
            .insert([
              {
                parent_id:
                  studentForm.parent_id,

                student_id:
                  studentId,

                relationship:
                  studentForm.relationship ||
                  "Parent",
              },
            ]);

          if (parentError) {
            throw parentError;
          }
        }
      }

      resetStudentForm();
      await loadData();
    } catch (error) {
      showError(
        "Erreur élève",
        error
      );
    }
  }

  async function toggleStudent(student) {
    setMessage("");

    const newActive =
      student.active === false;

    try {
      const { error } =
        await supabase
          .from("students")
          .update({
            active: newActive,
          })
          .eq("id", student.id);

      if (error) {
        throw error;
      }

      setMessage(
        newActive
          ? "✅ Élève réactivé."
          : "🚫 Élève désactivé."
      );

      await loadData();
    } catch (error) {
      showError(
        "Erreur statut élève",
        error
      );
    }
  }

  async function deleteStudent(student) {
    const confirmed =
      window.confirm(
        `Voulez-vous vraiment supprimer ${student.first_name} ${student.last_name} ?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error: relationError,
      } = await supabase
        .from("parent_students")
        .delete()
        .eq(
          "student_id",
          student.id
        );

      if (relationError) {
        throw relationError;
      }

      const { error } =
        await supabase
          .from("students")
          .delete()
          .eq("id", student.id);

      if (error) {
        throw error;
      }

      setMessage(
        "✅ Élève supprimé avec succès."
      );

      await loadData();
    } catch (error) {
      showError(
        "Erreur suppression élève",
        error
      );
    }
  }

  // =========================================================
  // ÉCOLES
  // =========================================================

  async function saveSchool(e) {
    e.preventDefault();
    setMessage("");

    const name =
      schoolForm.name.trim();

    if (!name) {
      setMessage(
        "Veuillez saisir le nom de l'école."
      );
      return;
    }

    try {
      const values = {
        name,

        address:
          schoolForm.address.trim() ||
          null,

        city:
          schoolForm.city.trim() ||
          null,

        phone:
          schoolForm.phone.trim() ||
          null,

        email:
          schoolForm.email.trim() ||
          null,
      };

      if (editingSchool) {
        const { error } =
          await supabase
            .from("schools")
            .update(values)
            .eq(
              "id",
              editingSchool.id
            );

        if (error) {
          throw error;
        }

        setMessage(
          "✅ École modifiée avec succès."
        );
      } else {
        const { error } =
          await supabase
            .from("schools")
            .insert([values]);

        if (error) {
          throw error;
        }

        setMessage(
          "✅ École créée avec succès."
        );
      }

      resetSchoolForm();
      await loadData();
    } catch (error) {
      showError(
        "Erreur école",
        error
      );
    }
  }

  async function deleteSchool(school) {
    if (
      !window.confirm(
        `Supprimer l'école "${school.name}" ?`
      )
    ) {
      return;
    }

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
        "✅ École supprimée."
      );

      await loadData();
    } catch (error) {
      showError(
        "Erreur suppression école",
        error
      );
    }
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
      const values = {
        school_id:
          classForm.school_id,

        name:
          classForm.name.trim(),

        level:
          classForm.level.trim() ||
          null,
      };

      if (editingClass) {
        const { error } =
          await supabase
            .from("classes")
            .update(values)
            .eq(
              "id",
              editingClass.id
            );

        if (error) {
          throw error;
        }

        setMessage(
          "✅ Classe modifiée avec succès."
        );
      } else {
        const { error } =
          await supabase
            .from("classes")
            .insert([values]);

        if (error) {
          throw error;
        }

        setMessage(
          "✅ Classe créée avec succès."
        );
      }

      resetClassForm();
      await loadData();
    } catch (error) {
      showError(
        "Erreur classe",
        error
      );
    }
  }

  async function deleteClass(classItem) {
    if (
      !window.confirm(
        `Supprimer la classe "${classItem.name}" ?`
      )
    ) {
      return;
    }

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
        "✅ Classe supprimée."
      );

      await loadData();
    } catch (error) {
      showError(
        "Erreur suppression classe",
        error
      );
    }
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
            .update({ name })
            .eq(
              "id",
              editingSubject.id
            );

        if (error) {
          throw error;
        }

        setMessage(
          "✅ Matière modifiée avec succès."
        );
      } else {
        const { error } =
          await supabase
            .from("subjects")
            .insert([{ name }]);

        if (error) {
          throw error;
        }

        setMessage(
          "✅ Matière créée avec succès."
        );
      }

      resetSubjectForm();
      await loadData();
    } catch (error) {
      showError(
        "Erreur matière",
        error
      );
    }
  }

  async function deleteSubject(subject) {
    if (
      !window.confirm(
        `Supprimer la matière "${subject.name}" ?`
      )
    ) {
      return;
    }

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
        "✅ Matière supprimée."
      );

      await loadData();
    } catch (error) {
      showError(
        "Erreur suppression matière",
        error
      );
    }
  }

  // =========================================================
  // RESET FORMS
  // =========================================================

  function resetTeacherForm() {
    setTeacherForm({
      full_name: "",
      email: "",
      phone: "",
      school_id: "",
    });

    setEditingTeacher(null);
    setShowTeacherForm(false);
  }

  function resetStudentForm() {
    setStudentForm({
      school_id: "",
      class_id: "",
      first_name: "",
      last_name: "",
      student_code: "",
      photo_url: "",
      active: true,
      parent_id: "",
      relationship: "Parent",
    });

    setEditingStudent(null);
    setShowStudentForm(false);
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

  // =========================================================
  // EDIT
  // =========================================================

  function startEditTeacher(teacher) {
    setEditingTeacher(teacher);

    setTeacherForm({
      full_name:
        teacher.full_name || "",

      email: "",

      phone:
        teacher.phone || "",

      school_id:
        teacher.school_id || "",
    });

    setShowTeacherForm(true);
  }

  function startEditStudent(student) {
    const relation =
      parentStudents.find(
        (item) =>
          item.student_id ===
          student.id
      );

    setEditingStudent(student);

    setStudentForm({
      school_id:
        student.school_id || "",

      class_id:
        student.class_id || "",

      first_name:
        student.first_name || "",

      last_name:
        student.last_name || "",

      student_code:
        student.student_code || "",

      photo_url:
        student.photo_url || "",

      active:
        student.active !== false,

      parent_id:
        relation?.parent_id || "",

      relationship:
        relation?.relationship ||
        "Parent",
    });

    setShowStudentForm(true);
  }

  function startEditSchool(school) {
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

  function startEditClass(classItem) {
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

  function startEditSubject(subject) {
    setEditingSubject(subject);

    setSubjectForm({
      name:
        subject.name || "",
    });

    setShowSubjectForm(true);
  }

  // =========================================================
  // HELPERS DONNÉES
  // =========================================================

  function getSchoolName(schoolId) {
    if (!schoolId) {
      return "École inconnue";
    }

    return (
      schools.find(
        (school) =>
          String(school.id) ===
          String(schoolId)
      )?.name ||
      "École inconnue"
    );
  }

  function getClassName(classId) {
    if (!classId) {
      return "Classe inconnue";
    }

    return (
      classes.find(
        (item) =>
          String(item.id) ===
          String(classId)
      )?.name ||
      "Classe inconnue"
    );
  }

  function getSubjectName(subjectId) {
    if (
      subjectId === null ||
      subjectId === undefined
    ) {
      return "Matière inconnue";
    }

    /*
      subjects.id est BIGINT.
      Les valeurs peuvent arriver sous forme
      de number ou string selon le contexte.
    */

    return (
      subjects.find(
        (item) =>
          String(item.id) ===
          String(subjectId)
      )?.name ||
      "Matière inconnue"
    );
  }

  function getTeacherName(teacherId) {
    if (!teacherId) {
      return "Professeur inconnu";
    }

    return (
      teachers.find(
        (teacher) =>
          String(teacher.id) ===
          String(teacherId)
      )?.full_name ||
      "Professeur inconnu"
    );
  }

  function getStudentName(studentId) {
    const student =
      students.find(
        (item) =>
          String(item.id) ===
          String(studentId)
      );

    if (!student) {
      return "Élève inconnu";
    }

    return (
      `${student.first_name || ""} ${
        student.last_name || ""
      }`.trim() ||
      "Élève"
    );
  }

  function getParentName(studentId) {
    const relation =
      parentStudents.find(
        (item) =>
          String(item.student_id) ===
          String(studentId)
      );

    if (!relation) {
      return "Aucun parent associé";
    }

    return (
      parents.find(
        (parent) =>
          String(parent.id) ===
          String(relation.parent_id)
      )?.full_name ||
      "Parent inconnu"
    );
  }

  function getParentRelationship(studentId) {
    return (
      parentStudents.find(
        (item) =>
          String(item.student_id) ===
          String(studentId)
      )?.relationship ||
      "Non renseigné"
    );
  }

  function getExerciseName(exerciseId) {
    return (
      exercises.find(
        (exercise) =>
          String(exercise.id) ===
          String(exerciseId)
      )?.title ||
      "Exercice inconnu"
    );
  }

  // =========================================================
  // CLASSES DISPONIBLES POUR L'ÉLÈVE
  // =========================================================

  const availableClasses = useMemo(() => {
    if (!studentForm.school_id) {
      return [];
    }

    return classes.filter(
      (item) =>
        String(item.school_id) ===
        String(studentForm.school_id)
    );
  }, [
    classes,
    studentForm.school_id,
  ]);

  // =========================================================
  // NAVIGATION
  // =========================================================

  function openSection(section) {
    setActiveSection(section);
    setMessage("");

    if (
      section === "admin-control"
    ) {
      loadAdminControlData();
    }
  }

  function renderNavigation() {
    const items = [
      ["dashboard", "📊 Tableau de bord"],
      ["teachers", "👨‍🏫 Professeurs"],
      ["students", "👨‍🎓 Élèves"],
      ["parents", "👪 Parents"],
      ["schools", "🏫 Écoles"],
      ["classes", "📚 Classes"],
      ["subjects", "📖 Matières"],
      ["documents", "📄 Documents"],
      ["exercises", "📝 Exercices"],
      ["questions", "❓ Questions"],
      ["notifications", "🔔 Notifications"],
      ["admin-control", "👑 Contrôle total"],
    ];

    return (
      <div className="notice">
        <h2>🛠️ Administration</h2>

        <div className="grid">
          {items.map(
            ([section, label]) => (
              <button
                key={section}
                onClick={() =>
                  openSection(section)
                }
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  function renderDashboard() {
    const cards = [
      ["teachers", "👨‍🏫 Professeurs"],
      ["students", "👨‍🎓 Élèves"],
      ["parents", "👪 Parents"],
      ["schools", "🏫 Écoles"],
      ["classes", "📚 Classes"],
      ["subjects", "📖 Matières"],
      ["documents", "📄 Documents"],
      ["exercises", "📝 Exercices"],
      ["notifications", "🔔 Notifications"],
    ];

    return (
      <>
        <div className="grid">
          {cards.map(
            ([key, label]) => (
              <div
                className="stat"
                key={key}
              >
                <strong>
                  {stats[key] || 0}
                </strong>

                <span>
                  {label}
                </span>
              </div>
            )
          )}
        </div>

        <div className="notice">
          <h2>
            🎯 Contrôle administrateur
          </h2>

          <p>
            L'administrateur peut
            gérer les écoles, classes,
            matières, professeurs et
            élèves.
          </p>

          <p>
            Il peut également consulter
            les documents, exercices,
            questions, présences et
            notifications.
          </p>
        </div>
      </>
    );
  }

  // =========================================================
  // PROFESSEURS
  // =========================================================

  function renderTeachers() {
    return (
      <>
        <div className="notice">
          <h2>
            👨‍🏫 Gestion des professeurs
          </h2>

          <p>
            Total : {teachers.length}
          </p>

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
                  school_id: "",
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
              École
            </label>

            <select
              value={
                teacherForm.school_id
              }
              onChange={(e) =>
                setTeacherForm({
                  ...teacherForm,
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
              onClick={
                resetTeacherForm
              }
            >
              Annuler
            </button>
          </form>
        )}

        <div className="grid">
          {teachers.length === 0 ? (
            <div className="notice">
              Aucun professeur.
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
                    🏫{" "}
                    {getSchoolName(
                      teacher.school_id
                    )}
                  </span>

                  <span>
                    📞{" "}
                    {teacher.phone ||
                      "Téléphone non renseigné"}
                  </span>

                  <span>
                    Rôle : teacher
                  </span>

                  <span>
                    Statut :{" "}
                    {teacher.active ===
                    false
                      ? "🔴 Inactif"
                      : "🟢 Actif"}
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
                    {teacher.active ===
                    false
                      ? "✅ Réactiver"
                      : "🚫 Désactiver"}
                  </button>
                </div>
              )
            )
          )}
        </div>
      </>
    );
  }

  // =========================================================
  // ÉLÈVES
  // =========================================================

  function renderStudents() {
    return (
      <>
        <div className="notice">
          <h2>
            👨‍🎓 Gestion des élèves
          </h2>

          <p>
            Total : {students.length}
          </p>

          <button
            onClick={() => {
              if (showStudentForm) {
                resetStudentForm();
              } else {
                setEditingStudent(null);

                setStudentForm({
                  school_id: "",
                  class_id: "",
                  first_name: "",
                  last_name: "",
                  student_code: "",
                  photo_url: "",
                  active: true,
                  parent_id: "",
                  relationship:
                    "Parent",
                });

                setShowStudentForm(true);
              }
            }}
          >
            {showStudentForm
              ? "Fermer"
              : "➕ Nouvel élève"}
          </button>
        </div>

        {showStudentForm && (
          <form
            className="notice"
            onSubmit={saveStudent}
          >
            <h3>
              {editingStudent
                ? "Modifier l'élève"
                : "Nouvel élève"}
            </h3>

            <label>
              École
            </label>

            <select
              value={
                studentForm.school_id
              }
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  school_id:
                    e.target.value,
                  class_id: "",
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
              Classe
            </label>

            <select
              value={
                studentForm.class_id
              }
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  class_id:
                    e.target.value,
                })
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
                      ? ` — ${item.level}`
                      : ""}
                  </option>
                )
              )}
            </select>

            <label>
              Prénom
            </label>

            <input
              type="text"
              placeholder="Ex : Amadou"
              value={
                studentForm.first_name
              }
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  first_name:
                    e.target.value,
                })
              }
              required
            />

            <label>
              Nom
            </label>

            <input
              type="text"
              placeholder="Ex : Diop"
              value={
                studentForm.last_name
              }
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  last_name:
                    e.target.value,
                })
              }
              required
            />

            <label>
              Code / matricule
            </label>

            <input
              type="text"
              placeholder="EC-2026-001"
              value={
                studentForm.student_code
              }
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  student_code:
                    e.target.value,
                })
              }
            />

            <label>
              URL de la photo
            </label>

            <input
              type="text"
              placeholder="https://..."
              value={
                studentForm.photo_url
              }
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  photo_url:
                    e.target.value,
                })
              }
            />

            <label>
              Parent
            </label>

            <select
              value={
                studentForm.parent_id
              }
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  parent_id:
                    e.target.value,
                })
              }
            >
              <option value="">
                Aucun parent
              </option>

              {parents.map(
                (parent) => (
                  <option
                    key={parent.id}
                    value={parent.id}
                  >
                    {parent.full_name ||
                      "Parent sans nom"}
                  </option>
                )
              )}
            </select>

            <label>
              Relation
            </label>

            <select
              value={
                studentForm.relationship
              }
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  relationship:
                    e.target.value,
                })
              }
            >
              <option value="Parent">
                Parent
              </option>

              <option value="Père">
                Père
              </option>

              <option value="Mère">
                Mère
              </option>

              <option value="Tuteur">
                Tuteur
              </option>

              <option value="Tutrice">
                Tutrice
              </option>
            </select>

            <label>
              Statut
            </label>

            <select
              value={
                studentForm.active
                  ? "true"
                  : "false"
              }
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  active:
                    e.target.value ===
                    "true",
                })
              }
            >
              <option value="true">
                🟢 Actif
              </option>

              <option value="false">
                🔴 Inactif
              </option>
            </select>

            <button type="submit">
              {editingStudent
                ? "💾 Enregistrer"
                : "Créer l'élève"}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={
                resetStudentForm
              }
            >
              Annuler
            </button>
          </form>
        )}

        <div className="grid">
          {students.length === 0 ? (
            <div className="notice">
              Aucun élève trouvé.
            </div>
          ) : (
            students.map(
              (student) => (
                <div
                  className="stat"
                  key={student.id}
                >
                  {student.photo_url && (
                    <img
                      src={
                        student.photo_url
                      }
                      alt={`${student.first_name} ${student.last_name}`}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit:
                          "cover",
                        borderRadius:
                          "50%",
                      }}
                    />
                  )}

                  <strong>
                    👨‍🎓{" "}
                    {
                      student.first_name
                    }{" "}
                    {
                      student.last_name
                    }
                  </strong>

                  <span>
                    🏫{" "}
                    {getSchoolName(
                      student.school_id
                    )}
                  </span>

                  <span>
                    📚{" "}
                    {student.class_id
                      ? getClassName(
                          student.class_id
                        )
                      : "Non affectée"}
                  </span>

                  <span>
                    🆔{" "}
                    {student.student_code ||
                      "Non renseigné"}
                  </span>

                  <span>
                    👪{" "}
                    {getParentName(
                      student.id
                    )}
                  </span>

                  <span>
                    Relation :{" "}
                    {getParentRelationship(
                      student.id
                    )}
                  </span>

                  <span>
                    Statut :{" "}
                    {student.active ===
                    false
                      ? "🔴 Inactif"
                      : "🟢 Actif"}
                  </span>

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
                      toggleStudent(
                        student
                      )
                    }
                  >
                    {student.active ===
                    false
                      ? "✅ Réactiver"
                      : "🚫 Désactiver"}
                  </button>

                  <button
                    onClick={() =>
                      deleteStudent(
                        student
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
      </>
    );
  }

  // =========================================================
  // PARENTS
  // =========================================================

  function renderParents() {
    return (
      <>
        <div className="notice">
          <h2>
            👪 Tous les parents
          </h2>

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
            parents.map(
              (parent) => {
                const linkedStudents =
                  parentStudents.filter(
                    (item) =>
                      String(
                        item.parent_id
                      ) ===
                      String(parent.id)
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
                      Rôle : parent
                    </span>

                    <span>
                      👨‍🎓 Élèves associés :{" "}
                      {
                        linkedStudents.length
                      }
                    </span>

                    {linkedStudents.map(
                      (relation) => (
                        <span
                          key={`${relation.parent_id}-${relation.student_id}`}
                        >
                          •{" "}
                          {getStudentName(
                            relation.student_id
                          )}{" "}
                          —{" "}
                          {relation.relationship ||
                            "Parent"}
                        </span>
                      )
                    )}
                  </div>
                );
              }
            )
          )}
        </div>
      </>
    );
  }

  // =========================================================
  // ÉCOLES
  // =========================================================

  function renderSchools() {
    return (
      <>
        <div className="notice">
          <h2>
            🏫 Gestion des écoles
          </h2>

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

            <label>
              Nom de l'école
            </label>

            <input
              type="text"
              placeholder="Ex : École Connectée"
              value={schoolForm.name}
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
              value={schoolForm.city}
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
              onClick={
                resetSchoolForm
              }
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
                    🏫 {school.name}
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
      </>
    );
  }

  // =========================================================
  // CLASSES
  // =========================================================

  function renderClasses() {
    return (
      <>
        <div className="notice">
          <h2>
            📚 Gestion des classes
          </h2>

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
              value={classForm.name}
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
              onClick={
                resetClassForm
              }
            >
              Annuler
            </button>
          </form>
        )}

        <div className="grid">
          {classes.length === 0 ? (
            <div className="notice">
              Aucune classe.
            </div>
          ) : (
            classes.map(
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
            )
          )}
        </div>
      </>
    );
  }

  // =========================================================
  // MATIÈRES
  // =========================================================

  function renderSubjects() {
    return (
      <>
        <div className="notice">
          <h2>
            📖 Gestion des matières
          </h2>

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
              onClick={
                resetSubjectForm
              }
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
      </>
    );
  }

  // =========================================================
  // DOCUMENTS
  // =========================================================

  function renderDocuments() {
    return (
      <>
        <div className="notice">
          <h2>
            📄 Tous les documents /
            leçons
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
                      {
                        document.description
                      }
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
                      href={
                        document.file_url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      📥 Ouvrir le document
                    </a>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </>
    );
  }

  // =========================================================
  // EXERCICES
  // =========================================================

  function renderExercises() {
    return (
      <>
        <div className="notice">
          <h2>
            📝 Tous les exercices
          </h2>

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
            {exercises.map(
              (exercise) => {
                const exerciseQuestions =
                  questions.filter(
                    (question) =>
                      String(
                        question.exercise_id
                      ) ===
                      String(
                        exercise.id
                      )
                  );

                return (
                  <div
                    className="stat"
                    key={exercise.id}
                  >
                    <strong>
                      📝{" "}
                      {exercise.title}
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
                      {
                        exerciseQuestions.length
                      }
                    </span>

                    <span>
                      Durée :{" "}
                      {
                        exercise.duration_minutes ||
                        0
                      }{" "}
                      min
                    </span>

                    <span>
                      Statut :{" "}
                      {exercise.published
                        ? "🟢 Publié"
                        : "🟡 Brouillon"}
                    </span>

                    {exercise.description && (
                      <span>
                        {
                          exercise.description
                        }
                      </span>
                    )}

                    {exercise.instructions && (
                      <span>
                        Instructions :{" "}
                        {
                          exercise.instructions
                        }
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
              }
            )}
          </div>
        )}
      </>
    );
  }

  // =========================================================
  // QUESTIONS
  // =========================================================

  function renderQuestions() {
    return (
      <>
        <div className="notice">
          <h2>
            ❓ Questions des exercices
          </h2>

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
            {questions.map(
              (question) => (
                <div
                  className="stat"
                  key={question.id}
                >
                  <strong>
                    ❓ Question{" "}
                    {question.position ||
                      ""}
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
                    {
                      question.question_type
                    }
                  </span>

                  <span>
                    Points :{" "}
                    {question.points ||
                      0}
                  </span>

                  {question.correct_answer && (
                    <span>
                      Réponse correcte :{" "}
                      {
                        question.correct_answer
                      }
                    </span>
                  )}

                  {question.options && (
                    <span>
                      Options :{" "}
                      {typeof question.options ===
                      "string"
                        ? question.options
                        : JSON.stringify(
                            question.options
                          )}
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </>
    );
  }

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  function renderNotifications() {
    return (
      <>
        <div className="notice">
          <h2>
            🔔 Notifications /
            échanges
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
                      ? "🟢 Lu"
                      : "🔴 Non lu"}
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

  // =========================================================
  // CONTRÔLE TOTAL
  // =========================================================

  function renderAdminControl() {
    return (
      <>
        <div className="notice">
          <h2>
            👑 Contrôle total
          </h2>

          <p>
            Vue globale de l'activité
            de l'application.
          </p>

          {adminControlLoading && (
            <p>
              ⏳ Chargement...
            </p>
          )}
        </div>

        <div className="grid">
          <button
            onClick={() =>
              setAdminControlTab(
                "documents"
              )
            }
          >
            📄 Documents (
            {adminDocuments.length})
          </button>

          <button
            onClick={() =>
              setAdminControlTab(
                "exercises"
              )
            }
          >
            📝 Exercices (
            {adminExercises.length})
          </button>

          <button
            onClick={() =>
              setAdminControlTab(
                "attendance"
              )
            }
          >
            🕘 Présences (
            {adminAttendance.length})
          </button>

          <button
            onClick={() =>
              setAdminControlTab(
                "notifications"
              )
            }
          >
            🔔 Activités (
            {adminNotifications.length})
          </button>
        </div>

        {adminControlTab ===
          "documents" && (
          <div className="notice">
            <h3>
              📄 Tous les documents
            </h3>

            {adminDocuments.length ===
            0 ? (
              <p>
                Aucun document trouvé.
              </p>
            ) : (
              <div className="grid">
                {adminDocuments.map(
                  (document) => (
                    <div
                      className="stat"
                      key={
                        document.id
                      }
                    >
                      <strong>
                        📄{" "}
                        {
                          document.title
                        }
                      </strong>

                      <span>
                        Type :{" "}
                        {
                          document.document_type
                        }
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
                          href={
                            document.file_url
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          📥 Ouvrir
                        </a>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {adminControlTab ===
          "exercises" && (
          <div className="notice">
            <h3>
              📝 Tous les exercices
            </h3>

            {adminExercises.length ===
            0 ? (
              <p>
                Aucun exercice trouvé.
              </p>
            ) : (
              <div className="grid">
                {adminExercises.map(
                  (exercise) => (
                    <div
                      className="stat"
                      key={
                        exercise.id
                      }
                    >
                      <strong>
                        📝{" "}
                        {
                          exercise.title
                        }
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
                          ? "🟢 Publié"
                          : "🟡 Brouillon"}
                      </span>

                      <span>
                        📅{" "}
                        {formatDate(
                          exercise.created_at
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {adminControlTab ===
          "attendance" && (
          <div className="notice">
            <h3>
              🕘 Toutes les présences
            </h3>

            {adminAttendance.length ===
            0 ? (
              <p>
                Aucune présence enregistrée.
              </p>
            ) : (
              <div className="grid">
                {adminAttendance.map(
                  (attendance) => (
                    <div
                      className="stat"
                      key={
                        attendance.id
                      }
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
                  )
                )}
              </div>
            )}
          </div>
        )}

        {adminControlTab ===
          "notifications" && (
          <div className="notice">
            <h3>
              🔔 Activités /
              notifications
            </h3>

            {adminNotifications.length ===
            0 ? (
              <p>
                Aucune activité trouvée.
              </p>
            ) : (
              <div className="grid">
                {adminNotifications.map(
                  (notification) => (
                    <div
                      className="stat"
                      key={
                        notification.id
                      }
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
                          ? "🟢 Lu"
                          : "🔴 Non lu"}
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

  // =========================================================
  // SECTION ACTIVE
  // =========================================================

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

  // =========================================================
  // CHARGEMENT
  // =========================================================

  if (loading) {
    return (
      <div className="center">
        ⏳ Chargement de
        l'administration…
      </div>
    );
  }

  // =========================================================
  // AFFICHAGE
  // =========================================================

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
              {session?.user?.email ||
                "Administrateur"}
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

        {activeSection !==
          "dashboard" && (
          <div className="notice">
            <button
              className="secondary"
              onClick={() =>
                openSection(
                  "dashboard"
                )
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
