import React, { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function TeacherDashboard({ session, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [exercises, setExercises] = useState([]);

  // Toutes les classes/matieres de l'ecole
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Classes et matieres attribuees au professeur
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);

  const [schoolId, setSchoolId] = useState(null);
  const [teacherName, setTeacherName] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showDocumentForm, setShowDocumentForm] =
    useState(false);

  const [showExerciseForm, setShowExerciseForm] =
    useState(false);

  // ================================
  // DOCUMENT
  // ================================

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [documentType, setDocumentType] =
    useState("lecon");

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] =
    useState("");

  const [file, setFile] = useState(null);

  const [uploading, setUploading] =
    useState(false);

  // ================================
  // EXERCICE
  // ================================

  const [exerciseTitle, setExerciseTitle] =
    useState("");

  const [exerciseDescription, setExerciseDescription] =
    useState("");

  const [instructions, setInstructions] =
    useState("");

  const [duration, setDuration] =
    useState("30");

  const [exerciseClassId, setExerciseClassId] =
    useState("");

  const [exerciseSubjectId, setExerciseSubjectId] =
    useState("");

  const [publishingExercise, setPublishingExercise] =
    useState(false);

  // ================================
  // CHARGEMENT
  // ================================

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      // ==========================================
      // 1. PROFIL DU PROFESSEUR
      // ==========================================

      const {
        data: profile,
        error: profileError
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, role, school_id"
        )
        .eq(
          "id",
          session.user.id
        )
        .single();

      if (profileError) {
        throw profileError;
      }

      setSchoolId(profile.school_id);
      setTeacherName(
        profile.full_name || "Professeur"
      );

      // ==========================================
      // 2. DOCUMENTS
      // ==========================================

      const {
        data: documentsData,
        error: documentsError
      } = await supabase
        .from("documents")
        .select("*")
        .eq(
          "teacher_id",
          session.user.id
        )
        .order("created_at", {
          ascending: false
        });

      if (documentsError) {
        throw documentsError;
      }

      setDocuments(
        documentsData || []
      );

      // ==========================================
      // 3. EXERCICES
      // ==========================================

      const {
        data: exercisesData,
        error: exercisesError
      } = await supabase
        .from("exercises")
        .select("*")
        .eq(
          "teacher_id",
          session.user.id
        )
        .order("created_at", {
          ascending: false
        });

      if (exercisesError) {
        throw exercisesError;
      }

      setExercises(
        exercisesData || []
      );

      // ==========================================
      // 4. TOUTES LES CLASSES DE L'ECOLE
      // ==========================================

      const {
        data: allClasses,
        error: classesError
      } = await supabase
        .from("classes")
        .select(
          "id, name, level, school_id"
        )
        .eq(
          "school_id",
          profile.school_id
        )
        .order("name");

      if (classesError) {
        throw classesError;
      }

      setClasses(
        allClasses || []
      );

      // ==========================================
      // 5. TOUTES LES MATIERES
      // ==========================================

      const {
        data: allSubjects,
        error: subjectsError
      } = await supabase
        .from("subjects")
        .select(
          "id, name"
        )
        .order("name");

      if (subjectsError) {
        throw subjectsError;
      }

      setSubjects(
        allSubjects || []
      );

      // ==========================================
      // 6. ATTRIBUTIONS DU PROFESSEUR
      // ==========================================

      const {
        data: assignments,
        error: assignmentsError
      } = await supabase
        .from("teacher_classes")
        .select(
          "id, teacher_id, class_id, subject_id"
        )
        .eq(
          "teacher_id",
          session.user.id
        );

      if (assignmentsError) {
        throw assignmentsError;
      }

      const assignmentRows =
        assignments || [];

      // ==========================================
      // 7. ID DES CLASSES ATTRIBUEES
      // ==========================================

      const assignedClassIds = [
        ...new Set(
          assignmentRows
            .map(
              (item) =>
                item.class_id
            )
            .filter(Boolean)
        )
      ];

      // ==========================================
      // 8. ID DES MATIERES ATTRIBUEES
      // ==========================================

      const assignedSubjectIds = [
        ...new Set(
          assignmentRows
            .map(
              (item) =>
                item.subject_id
            )
            .filter(
              (id) =>
                id !== null &&
                id !== undefined
            )
        )
      ];

      // ==========================================
      // 9. CLASSES ATTRIBUEES
      // ==========================================

      if (
        assignedClassIds.length > 0
      ) {
        const {
          data: assignedClasses,
          error: assignedClassesError
        } = await supabase
          .from("classes")
          .select(
            "id, name, level, school_id"
          )
          .in(
            "id",
            assignedClassIds
          )
          .order("name");

        if (assignedClassesError) {
          throw assignedClassesError;
        }

        setTeacherClasses(
          assignedClasses || []
        );
      } else {
        setTeacherClasses([]);
      }

      // ==========================================
      // 10. MATIERES ATTRIBUEES
      // ==========================================

      if (
        assignedSubjectIds.length > 0
      ) {
        const {
          data: assignedSubjects,
          error: assignedSubjectsError
        } = await supabase
          .from("subjects")
          .select(
            "id, name"
          )
          .in(
            "id",
            assignedSubjectIds
          )
          .order("name");

        if (assignedSubjectsError) {
          throw assignedSubjectsError;
        }

        setTeacherSubjects(
          assignedSubjects || []
        );
      } else {
        setTeacherSubjects([]);
      }

    } catch (error) {
      console.error(
        "Erreur loadData :",
        error
      );

      setMessage(
        "Erreur : " +
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // PUBLICATION DOCUMENT
  // ==========================================

  async function publishDocument() {
    setMessage("");

    if (!title.trim()) {
      setMessage(
        "Veuillez saisir un titre."
      );
      return;
    }

    if (!classId) {
      setMessage(
        "Veuillez choisir une classe."
      );
      return;
    }

    if (!subjectId) {
      setMessage(
        "Veuillez choisir une matière."
      );
      return;
    }

    if (!file) {
      setMessage(
        "Veuillez choisir un fichier."
      );
      return;
    }

    setUploading(true);

    try {
      const filePath =
        `${session.user.id}/${Date.now()}-${file.name}`;

      const {
        error: uploadError
      } = await supabase.storage
        .from("school-documents")
        .upload(
          filePath,
          file
        );

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: publicUrlData
      } = supabase.storage
        .from("school-documents")
        .getPublicUrl(
          filePath
        );

      const {
        error: insertError
      } = await supabase
        .from("documents")
        .insert({
          teacher_id:
            session.user.id,

          class_id:
            classId,

          subject_id:
            Number(subjectId),

          title:
            title.trim(),

          description:
            description.trim(),

          document_type:
            documentType,

          file_url:
            publicUrlData.publicUrl
        });

      if (insertError) {
        throw insertError;
      }

      setMessage(
        "Document publié avec succès !"
      );

      setTitle("");
      setDescription("");
      setDocumentType("lecon");
      setClassId("");
      setSubjectId("");
      setFile(null);

      setShowDocumentForm(false);

      await loadData();

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur : " +
        error.message
      );
    } finally {
      setUploading(false);
    }
  }

  // ==========================================
  // PUBLICATION EXERCICE
  // ==========================================

  async function publishExercise() {
    setMessage("");

    if (!schoolId) {
      setMessage(
        "Votre profil n'est associé à aucune école."
      );
      return;
    }

    if (!exerciseTitle.trim()) {
      setMessage(
        "Veuillez saisir le titre de l'exercice."
      );
      return;
    }

    if (!exerciseClassId) {
      setMessage(
        "Veuillez choisir une classe."
      );
      return;
    }

    if (!exerciseSubjectId) {
      setMessage(
        "Veuillez choisir une matière."
      );
      return;
    }

    if (!instructions.trim()) {
      setMessage(
        "Veuillez saisir les consignes."
      );
      return;
    }

    const durationNumber =
      Number(duration);

    if (
      !durationNumber ||
      durationNumber <= 0
    ) {
      setMessage(
        "La durée doit être supérieure à 0 minute."
      );
      return;
    }

    setPublishingExercise(true);

    try {
      const {
        error
      } = await supabase
        .from("exercises")
        .insert({
          teacher_id:
            session.user.id,

          school_id:
            schoolId,

          class_id:
            exerciseClassId,

          subject_id:
            Number(exerciseSubjectId),

          title:
            exerciseTitle.trim(),

          description:
            exerciseDescription.trim(),

          instructions:
            instructions.trim(),

          duration_minutes:
            durationNumber,

          published:
            true
        });

      if (error) {
        throw error;
      }

      setMessage(
        "Exercice publié avec succès !"
      );

      setExerciseTitle("");
      setExerciseDescription("");
      setInstructions("");
      setDuration("30");
      setExerciseClassId("");
      setExerciseSubjectId("");

      setShowExerciseForm(false);

      await loadData();

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur lors de la publication de l'exercice : " +
        error.message
      );
    } finally {
      setPublishingExercise(false);
    }
  }

  // ==========================================
  // CHARGEMENT
  // ==========================================

  if (loading) {
    return (
      <div className="center">
        Chargement de l'espace professeur…
      </div>
    );
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <main className="page">
      <section className="card dashboard">

        {/* ================================
            HEADER
        ================================= */}

        <div className="top">

          <div>

            <p className="eyebrow">
              ÉCOLE CONNECTÉE
            </p>

            <h1>
              Espace Professeur 👨‍🏫
            </h1>

            <p>
              Bonjour{" "}
              <strong>
                {teacherName}
              </strong>
            </p>

            <p>
              {session.user.email}
            </p>

          </div>

          <button
            className="secondary"
            onClick={onLogout}
          >
            Déconnexion
          </button>

        </div>

        {/* ================================
            MON ENSEIGNEMENT
        ================================= */}

        <div className="notice">

          <h2>
            👨‍🏫 Mon enseignement
          </h2>

          <p>
            Retrouvez ici les classes et
            matières qui vous sont attribuées.
          </p>

          <div className="grid">

            {/* MATIERES */}

            <div className="stat">

              <strong>
                📚 Mes matières
              </strong>

              {teacherSubjects.length === 0 ? (

                <span>
                  Aucune matière attribuée
                </span>

              ) : (

                teacherSubjects.map(
                  (subject) => (
                    <span
                      key={subject.id}
                    >
                      • {subject.name}
                    </span>
                  )
                )

              )}

            </div>

            {/* CLASSES */}

            <div className="stat">

              <strong>
                🎓 Mes classes
              </strong>

              {teacherClasses.length === 0 ? (

                <span>
                  Aucune classe attribuée
                </span>

              ) : (

                teacherClasses.map(
                  (teacherClass) => (
                    <span
                      key={teacherClass.id}
                    >
                      • {teacherClass.name}
                      {teacherClass.level
                        ? ` • ${teacherClass.level}`
                        : ""}
                    </span>
                  )
                )

              )}

            </div>

          </div>

        </div>

        {/* ================================
            STATISTIQUES
        ================================= */}

        <div className="grid">

          <div className="stat">

            <strong>
              {documents.length}
            </strong>

            <span>
              Publications
            </span>

          </div>

          <div className="stat">

            <strong>
              {exercises.length}
            </strong>

            <span>
              Exercices
            </span>

          </div>

          <div className="stat">

            <strong>
              {teacherClasses.length}
            </strong>

            <span>
              Mes classes
            </span>

          </div>

          <div className="stat">

            <strong>
              {teacherSubjects.length}
            </strong>

            <span>
              Mes matières
            </span>

          </div>

        </div>

        {/* ================================
            MESSAGE
        ================================= */}

        {message && (
          <div className="notice">

            <p className="message">
              {message}
            </p>

          </div>
        )}

        {/* ================================
            DOCUMENTS
        ================================= */}

        <div className="notice">

          <h2>
            📚 Documents
          </h2>

          <p>
            Partagez vos leçons,
            cours, exercices et devoirs
            avec vos élèves.
          </p>

          <button
            onClick={() =>
              setShowDocumentForm(
                !showDocumentForm
              )
            }
          >
            {showDocumentForm
              ? "Fermer"
              : "+ Publier un document"}
          </button>

        </div>

        {/* FORMULAIRE DOCUMENT */}

        {showDocumentForm && (
          <div className="card">

            <h2>
              Nouveau document
            </h2>

            <label>
              Type de document
            </label>

            <select
              value={documentType}
              onChange={(e) =>
                setDocumentType(
                  e.target.value
                )
              }
            >

              <option value="lecon">
                Leçon
              </option>

              <option value="exercice">
                Exercice
              </option>

              <option value="interrogation">
                Interrogation
              </option>

              <option value="devoir">
                Devoir
              </option>

              <option value="cours">
                Cours
              </option>

              <option value="autre">
                Autre
              </option>

            </select>

            {/* CLASSE ATTRIBUEE */}

            <label>
              Classe
            </label>

            <select
              value={classId}
              onChange={(e) =>
                setClassId(
                  e.target.value
                )
              }
            >

              <option value="">
                Choisir une classe
              </option>

              {teacherClasses.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                    {item.level
                      ? ` • ${item.level}`
                      : ""}
                  </option>
                )
              )}

            </select>

            {/* MATIERE ATTRIBUEE */}

            <label>
              Matière
            </label>

            <select
              value={subjectId}
              onChange={(e) =>
                setSubjectId(
                  e.target.value
                )
              }
            >

              <option value="">
                Choisir une matière
              </option>

              {teacherSubjects.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}

            </select>

            <label>
              Titre
            </label>

            <input
              type="text"
              placeholder="Ex : Les fractions"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
            />

            <label>
              Description
            </label>

            <textarea
              placeholder="Décrivez le contenu..."
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
            />

            <label>
              Document
            </label>

            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) =>
                setFile(
                  e.target.files?.[0] ||
                  null
                )
              }
            />

            <button
              onClick={
                publishDocument
              }
              disabled={uploading}
            >

              {uploading
                ? "Publication en cours..."
                : "📤 Publier"}

            </button>

          </div>
        )}

        {/* ================================
            EXERCICES
        ================================= */}

        <div className="notice">

          <h2>
            📝 Exercices
          </h2>

          <p>
            Créez des exercices pour
            vos classes et donnez des
            consignes à vos élèves.
          </p>

          <button
            onClick={() =>
              setShowExerciseForm(
                !showExerciseForm
              )
            }
          >

            {showExerciseForm
              ? "Fermer"
              : "+ Nouvel exercice"}

          </button>

        </div>

        {/* FORMULAIRE EXERCICE */}

        {showExerciseForm && (
          <div className="card">

            <h2>
              📝 Nouvel exercice
            </h2>

            <label>
              Classe
            </label>

            <select
              value={exerciseClassId}
              onChange={(e) =>
                setExerciseClassId(
                  e.target.value
                )
              }
            >

              <option value="">
                Choisir une classe
              </option>

              {teacherClasses.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                    {item.level
                      ? ` • ${item.level}`
                      : ""}
                  </option>
                )
              )}

            </select>

            <label>
              Matière
            </label>

            <select
              value={exerciseSubjectId}
              onChange={(e) =>
                setExerciseSubjectId(
                  e.target.value
                )
              }
            >

              <option value="">
                Choisir une matière
              </option>

              {teacherSubjects.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}

            </select>

            <label>
              Titre de l'exercice
            </label>

            <input
              type="text"
              placeholder="Ex : Exercices sur les fractions"
              value={exerciseTitle}
              onChange={(e) =>
                setExerciseTitle(
                  e.target.value
                )
              }
            />

            <label>
              Description
            </label>

            <textarea
              placeholder="Présentez brièvement l'exercice..."
              value={exerciseDescription}
              onChange={(e) =>
                setExerciseDescription(
                  e.target.value
                )
              }
            />

            <label>
              Consignes
            </label>

            <textarea
              placeholder="Écrivez les consignes que les élèves doivent suivre..."
              value={instructions}
              onChange={(e) =>
                setInstructions(
                  e.target.value
                )
              }
            />

            <label>
              Durée (minutes)
            </label>

            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) =>
                setDuration(
                  e.target.value
                )
              }
            />

            <button
              onClick={
                publishExercise
              }
              disabled={
                publishingExercise
              }
            >

              {publishingExercise
                ? "Publication en cours..."
                : "🚀 Publier l'exercice"}

            </button>

          </div>
        )}

        {/* ================================
            MES EXERCICES
        ================================= */}

        <div className="notice">

          <h2>
            📋 Mes exercices
          </h2>

          {exercises.length === 0 ? (

            <p>
              Vous n'avez encore créé
              aucun exercice.
            </p>

          ) : (

            exercises.map(
              (exercise) => (
                <div
                  key={exercise.id}
                  className="stat"
                >

                  <strong>
                    {exercise.title}
                  </strong>

                  <span>
                    {exercise.duration_minutes}
                    {" min • "}
                    {exercise.published
                      ? "Publié"
                      : "Brouillon"}
                  </span>

                </div>
              )
            )

          )}

        </div>

        {/* ================================
            MES PUBLICATIONS
        ================================= */}

        <div className="notice">

          <h2>
            📚 Mes publications
          </h2>

          {documents.length === 0 ? (

            <p>
              Vous n'avez encore publié
              aucun document.
            </p>

          ) : (

            documents.map(
              (document) => (
                <div
                  key={document.id}
                  className="stat"
                >

                  <strong>
                    {document.title}
                  </strong>

                  <span>
                    {document.document_type}
                  </span>

                </div>
              )
            )

          )}

        </div>

      </section>
    </main>
  );
}
