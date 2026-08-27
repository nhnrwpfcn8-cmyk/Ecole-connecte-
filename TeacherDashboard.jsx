import React, { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function TeacherDashboard({ session, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  const [schoolId, setSchoolId] = useState(null);
  const [teacherName, setTeacherName] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showDocumentForm, setShowDocumentForm] =
    useState(false);

  const [showExerciseForm, setShowExerciseForm] =
    useState(false);

  const [showVideoForm, setShowVideoForm] =
    useState(false);

  const [showLinkForm, setShowLinkForm] =
    useState(false);

  const [showEvaluationForm, setShowEvaluationForm] =
    useState(false);

  // =========================
  // DOCUMENT
  // =========================

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

  // =========================
  // EXERCICE
  // =========================

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

  // =========================
  // VIDEO
  // =========================

  const [videoTitle, setVideoTitle] =
    useState("");
  const [videoDescription, setVideoDescription] =
    useState("");
  const [videoUrl, setVideoUrl] =
    useState("");
  const [videoClassId, setVideoClassId] =
    useState("");
  const [videoSubjectId, setVideoSubjectId] =
    useState("");
  const [publishingVideo, setPublishingVideo] =
    useState(false);

  // =========================
  // LIEN
  // =========================

  const [linkTitle, setLinkTitle] =
    useState("");
  const [linkDescription, setLinkDescription] =
    useState("");
  const [linkUrl, setLinkUrl] =
    useState("");
  const [linkClassId, setLinkClassId] =
    useState("");
  const [linkSubjectId, setLinkSubjectId] =
    useState("");
  const [publishingLink, setPublishingLink] =
    useState(false);

  // =========================
  // EVALUATION
  // =========================

  const [evaluationStudentId, setEvaluationStudentId] =
    useState("");
  const [evaluationStars, setEvaluationStars] =
    useState(5);
  const [evaluationComment, setEvaluationComment] =
    useState("");
  const [evaluating, setEvaluating] =
    useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    }
  }, [session]);

  // =========================
  // CHARGEMENT
  // =========================

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      // PROFIL PROFESSEUR
      const {
        data: profile,
        error: profileError
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, role, school_id"
        )
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setSchoolId(profile.school_id);
      setTeacherName(profile.full_name || "");

      // DONNÉES PRINCIPALES
      const [
        documentsResult,
        exercisesResult,
        classesResult,
        subjectsResult,
        assignmentsResult
      ] = await Promise.all([
        supabase
          .from("documents")
          .select("*")
          .eq(
            "teacher_id",
            session.user.id
          )
          .order("created_at", {
            ascending: false
          }),

        supabase
          .from("exercises")
          .select("*")
          .eq(
            "teacher_id",
            session.user.id
          )
          .order("created_at", {
            ascending: false
          }),

        supabase
          .from("classes")
          .select("*")
          .eq(
            "school_id",
            profile.school_id
          )
          .order("name"),

        supabase
          .from("subjects")
          .select("*")
          .order("name"),

        supabase
          .from("teacher_classes")
          .select(
            "id, teacher_id, class_id, subject_id"
          )
          .eq(
            "teacher_id",
            session.user.id
          )
      ]);

      if (documentsResult.error)
        throw documentsResult.error;

      if (exercisesResult.error)
        throw exercisesResult.error;

      if (classesResult.error)
        throw classesResult.error;

      if (subjectsResult.error)
        throw subjectsResult.error;

      if (assignmentsResult.error)
        throw assignmentsResult.error;

      const allClasses =
        classesResult.data || [];

      const allSubjects =
        subjectsResult.data || [];

      const assignments =
        assignmentsResult.data || [];

      setDocuments(
        documentsResult.data || []
      );

      setExercises(
        exercisesResult.data || []
      );

      setClasses(allClasses);
      setSubjects(allSubjects);

      // CLASSES ATTRIBUÉES
      const assignedClassIds =
        [
          ...new Set(
            assignments
              .map((item) => item.class_id)
              .filter(Boolean)
          )
        ];

      const assignedClassList =
        allClasses.filter((item) =>
          assignedClassIds.includes(item.id)
        );

      setAssignedClasses(
        assignedClassList
      );

      // MATIÈRES ATTRIBUÉES
      const assignedSubjectIds =
        [
          ...new Set(
            assignments
              .map((item) => item.subject_id)
              .filter(Boolean)
              .map(Number)
          )
        ];

      const assignedSubjectList =
        allSubjects.filter((item) =>
          assignedSubjectIds.includes(
            Number(item.id)
          )
        );

      setAssignedSubjects(
        assignedSubjectList
      );

      // ÉLÈVES DE L'ÉCOLE
      const studentsResult =
        await supabase
          .from("students")
          .select("*")
          .eq(
            "school_id",
            profile.school_id
          )
          .order("full_name");

      if (!studentsResult.error) {
        setStudents(
          studentsResult.data || []
        );
      }

      // ÉVALUATIONS
      const evaluationsResult =
        await supabase
          .from("student_evaluations")
          .select("*")
          .eq(
            "teacher_id",
            session.user.id
          )
          .order("created_at", {
            ascending: false
          });

      if (!evaluationsResult.error) {
        setEvaluations(
          evaluationsResult.data || []
        );
      }

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur : " +
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // DOCUMENT
  // =========================

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

  // =========================
  // EXERCICE
  // =========================

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

  // =========================
  // VIDEO
  // =========================

  async function publishVideo() {
    setMessage("");

    if (!videoTitle.trim()) {
      setMessage(
        "Veuillez saisir le titre de la vidéo."
      );
      return;
    }

    if (!videoUrl.trim()) {
      setMessage(
        "Veuillez saisir le lien de la vidéo."
      );
      return;
    }

    if (!videoClassId) {
      setMessage(
        "Veuillez choisir une classe."
      );
      return;
    }

    if (!videoSubjectId) {
      setMessage(
        "Veuillez choisir une matière."
      );
      return;
    }

    setPublishingVideo(true);

    try {
      const {
        error
      } = await supabase
        .from("course_videos")
        .insert({
          teacher_id:
            session.user.id,
          school_id:
            schoolId,
          class_id:
            videoClassId,
          subject_id:
            Number(videoSubjectId),
          title:
            videoTitle.trim(),
          description:
            videoDescription.trim(),
          video_url:
            videoUrl.trim()
        });

      if (error) {
        throw error;
      }

      setMessage(
        "🎥 Vidéo publiée avec succès !"
      );

      setVideoTitle("");
      setVideoDescription("");
      setVideoUrl("");
      setVideoClassId("");
      setVideoSubjectId("");

      setShowVideoForm(false);

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur vidéo : " +
        error.message
      );
    } finally {
      setPublishingVideo(false);
    }
  }

  // =========================
  // LIEN
  // =========================

  async function publishLink() {
    setMessage("");

    if (!linkTitle.trim()) {
      setMessage(
        "Veuillez saisir le titre du lien."
      );
      return;
    }

    if (!linkUrl.trim()) {
      setMessage(
        "Veuillez saisir le lien du cours."
      );
      return;
    }

    if (!linkClassId) {
      setMessage(
        "Veuillez choisir une classe."
      );
      return;
    }

    if (!linkSubjectId) {
      setMessage(
        "Veuillez choisir une matière."
      );
      return;
    }

    setPublishingLink(true);

    try {
      const {
        error
      } = await supabase
        .from("course_links")
        .insert({
          teacher_id:
            session.user.id,
          school_id:
            schoolId,
          class_id:
            linkClassId,
          subject_id:
            Number(linkSubjectId),
          title:
            linkTitle.trim(),
          description:
            linkDescription.trim(),
          url:
            linkUrl.trim()
        });

      if (error) {
        throw error;
      }

      setMessage(
        "🔗 Lien publié avec succès !"
      );

      setLinkTitle("");
      setLinkDescription("");
      setLinkUrl("");
      setLinkClassId("");
      setLinkSubjectId("");

      setShowLinkForm(false);

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur lien : " +
        error.message
      );
    } finally {
      setPublishingLink(false);
    }
  }

  // =========================
  // EVALUATION
  // =========================

  async function evaluateStudent() {
    setMessage("");

    if (!evaluationStudentId) {
      setMessage(
        "Veuillez choisir un élève."
      );
      return;
    }

    if (
      evaluationStars < 1 ||
      evaluationStars > 5
    ) {
      setMessage(
        "La note doit être comprise entre 1 et 5 étoiles."
      );
      return;
    }

    setEvaluating(true);

    try {
      const {
        error
      } = await supabase
        .from("student_evaluations")
        .insert({
          teacher_id:
            session.user.id,
          student_id:
            evaluationStudentId,
          stars:
            Number(evaluationStars),
          comment:
            evaluationComment.trim() || null
        });

      if (error) {
        throw error;
      }

      setMessage(
        "⭐ Évaluation enregistrée avec succès !"
      );

      setEvaluationStudentId("");
      setEvaluationStars(5);
      setEvaluationComment("");

      setShowEvaluationForm(false);

      await loadData();

    } catch (error) {
      console.error(error);

      setMessage(
        "Erreur évaluation : " +
        error.message
      );
    } finally {
      setEvaluating(false);
    }
  }

  // =========================
  // CHARGEMENT
  // =========================

  if (loading) {
    return (
      <div className="center">
        Chargement de l'espace professeur…
      </div>
    );
  }

  // =========================
  // AFFICHAGE
  // =========================

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
              Espace Professeur 👨‍🏫
            </h1>

            <p>
              {teacherName ||
                session.user.email}
            </p>
          </div>

          <button
            className="secondary"
            onClick={onLogout}
          >
            Déconnexion
          </button>
        </div>

        {/* MES ATTRIBUTIONS */}

        <div className="notice">

          <h2>
            👨‍🏫 Mes attributions
          </h2>

          <p>
            Classes et matières qui me
            sont attribuées.
          </p>

          <div className="grid">

            <div className="stat">
              <strong>
                {assignedClasses.length}
              </strong>

              <span>
                Classes enseignées
              </span>
            </div>

            <div className="stat">
              <strong>
                {assignedSubjects.length}
              </strong>

              <span>
                Matières enseignées
              </span>
            </div>

          </div>

          <h3>
            🏫 Classes
          </h3>

          {assignedClasses.length === 0 ? (
            <p>
              Aucune classe attribuée pour le moment.
            </p>
          ) : (
            <p>
              {assignedClasses
                .map((item) => item.name)
                .join(" • ")}
            </p>
          )}

          <h3>
            📚 Matières
          </h3>

          {assignedSubjects.length === 0 ? (
            <p>
              Aucune matière attribuée pour le moment.
            </p>
          ) : (
            <p>
              {assignedSubjects
                .map((item) => item.name)
                .join(" • ")}
            </p>
          )}

        </div>

        {/* STATISTIQUES */}

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
              {assignedClasses.length}
            </strong>

            <span>
              Classes
            </span>
          </div>

          <div className="stat">
            <strong>
              {assignedSubjects.length}
            </strong>

            <span>
              Matières
            </span>
          </div>

        </div>

        {/* MESSAGE */}

        {message && (
          <div className="notice">
            <p className="message">
              {message}
            </p>
          </div>
        )}

        {/* =========================
            VIDEOS
        ========================= */}

        <div className="notice">

          <h2>
            🎥 Vidéos de cours
          </h2>

          <p>
            Publiez une vidéo de cours
            pour vos élèves.
          </p>

          <button
            onClick={() =>
              setShowVideoForm(
                !showVideoForm
              )
            }
          >
            {showVideoForm
              ? "Fermer"
              : "+ Publier une vidéo"}
          </button>

        </div>

        {showVideoForm && (
          <div className="card">

            <h2>
              🎥 Nouvelle vidéo
            </h2>

            <label>
              Classe
            </label>

            <select
              value={videoClassId}
              onChange={(e) =>
                setVideoClassId(
                  e.target.value
                )
              }
            >
              <option value="">
                Choisir une classe
              </option>

              {assignedClasses.map(
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
              Matière
            </label>

            <select
              value={videoSubjectId}
              onChange={(e) =>
                setVideoSubjectId(
                  e.target.value
                )
              }
            >
              <option value="">
                Choisir une matière
              </option>

              {assignedSubjects.map(
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
              Titre de la vidéo
            </label>

            <input
              type="text"
              placeholder="Ex : Les fractions"
              value={videoTitle}
              onChange={(e) =>
                setVideoTitle(
                  e.target.value
                )
              }
            />

            <label>
              Description
            </label>

            <textarea
              placeholder="Décrivez la vidéo..."
              value={videoDescription}
              onChange={(e) =>
                setVideoDescription(
                  e.target.value
                )
              }
            />

            <label>
              Lien de la vidéo
            </label>

            <input
              type="url"
              placeholder="https://youtube.com/..."
              value={videoUrl}
              onChange={(e) =>
                setVideoUrl(
                  e.target.value
                )
              }
            />

            <button
              onClick={publishVideo}
              disabled={publishingVideo}
            >
              {publishingVideo
                ? "Publication..."
                : "🎥 Publier la vidéo"}
            </button>

          </div>
        )}

        {/* =========================
            LIENS
        ========================= */}

        <div className="notice">

          <h2>
            🔗 Liens de cours
          </h2>

          <p>
            Partagez des ressources
            externes avec vos élèves.
          </p>

          <button
            onClick={() =>
              setShowLinkForm(
                !showLinkForm
              )
            }
          >
            {showLinkForm
              ? "Fermer"
              : "+ Publier un lien"}
          </button>

        </div>

        {showLinkForm && (
          <div className="card">

            <h2>
              🔗 Nouveau lien
            </h2>

            <label>
              Classe
            </label>

            <select
              value={linkClassId}
              onChange={(e) =>
                setLinkClassId(
                  e.target.value
                )
              }
            >
              <option value="">
                Choisir une classe
              </option>

              {assignedClasses.map(
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
              Matière
            </label>

            <select
              value={linkSubjectId}
              onChange={(e) =>
                setLinkSubjectId(
                  e.target.value
                )
              }
            >
              <option value="">
                Choisir une matière
              </option>

              {assignedSubjects.map(
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
              placeholder="Ex : Vidéo complémentaire"
              value={linkTitle}
              onChange={(e) =>
                setLinkTitle(
                  e.target.value
                )
              }
            />

            <label>
              Description
            </label>

            <textarea
              placeholder="Description de la ressource..."
              value={linkDescription}
              onChange={(e) =>
                setLinkDescription(
                  e.target.value
                )
              }
            />

            <label>
              Adresse du lien
            </label>

            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) =>
                setLinkUrl(
                  e.target.value
                )
              }
            />

            <button
              onClick={publishLink}
              disabled={publishingLink}
            >
              {publishingLink
                ? "Publication..."
                : "🔗 Publier le lien"}
            </button>

          </div>
        )}

        {/* =========================
            DOCUMENTS
        ========================= */}

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

              {assignedClasses.map(
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

              {assignedSubjects.map(
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

        {/* =========================
            EXERCICES
        ========================= */}

        <div className="notice">

          <h2>
            📝 Exercices
          </h2>

          <p>
            Créez des exercices pour
            vos classes.
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

              {assignedClasses.map(
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

              {assignedSubjects.map(
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
              placeholder="Écrivez les consignes..."
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
                ? "Publication..."
                : "🚀 Publier l'exercice"}
            </button>

          </div>
        )}

        {/* =========================
            EVALUATION
        ========================= */}

        <div className="notice">

          <h2>
            ⭐ Évaluation des élèves
          </h2>

          <p>
            Évaluez la conduite et
            l'attitude de vos élèves
            sur 5 étoiles.
          </p>

          <button
            onClick={() =>
              setShowEvaluationForm(
                !showEvaluationForm
              )
            }
          >
            {showEvaluationForm
              ? "Fermer"
              : "+ Évaluer un élève"}
          </button>

        </div>

        {showEvaluationForm && (
          <div className="card">

            <h2>
              ⭐ Nouvelle évaluation
            </h2>

            <label>
              Élève
            </label>

            <select
              value={evaluationStudentId}
              onChange={(e) =>
                setEvaluationStudentId(
                  e.target.value
                )
              }
            >
              <option value="">
                Choisir un élève
              </option>

              {students.map(
                (student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.full_name ||
                      student.name ||
                      "Élève"}
                  </option>
                )
              )}
            </select>

            <label>
              Note de conduite
            </label>

            <select
              value={evaluationStars}
              onChange={(e) =>
                setEvaluationStars(
                  Number(e.target.value)
                )
              }
            >
              <option value="5">
                ⭐⭐⭐⭐⭐ — Excellent
              </option>

              <option value="4">
                ⭐⭐⭐⭐ — Très bien
              </option>

              <option value="3">
                ⭐⭐⭐ — Bien
              </option>

              <option value="2">
                ⭐⭐ — À améliorer
              </option>

              <option value="1">
                ⭐ — Insuffisant
              </option>
            </select>

            <label>
              Commentaire
            </label>

            <textarea
              placeholder="Ajoutez un commentaire sur la conduite..."
              value={evaluationComment}
              onChange={(e) =>
                setEvaluationComment(
                  e.target.value
                )
              }
            />

            <button
              onClick={
                evaluateStudent
              }
              disabled={evaluating}
            >
              {evaluating
                ? "Enregistrement..."
                : "⭐ Enregistrer l'évaluation"}
            </button>

          </div>
        )}

        {/* =========================
            MES EXERCICES
        ========================= */}

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

        {/* =========================
            MES PUBLICATIONS
        ========================= */}

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

        {/* =========================
            MES EVALUATIONS
        ========================= */}

        <div className="notice">

          <h2>
            ⭐ Mes évaluations
          </h2>

          {evaluations.length === 0 ? (
            <p>
              Aucune évaluation enregistrée.
            </p>
          ) : (
            evaluations.map(
              (evaluation) => (
                <div
                  key={evaluation.id}
                  className="stat"
                >
                  <strong>
                    {"⭐".repeat(
                      Number(
                        evaluation.stars || 0
                      )
                    )}
                  </strong>

                  <span>
                    {evaluation.comment ||
                      "Aucun commentaire"}
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
