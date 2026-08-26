import React, { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function TeacherDashboard({ session, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exercises, setExercises] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showExerciseForm, setShowExerciseForm] = useState(false);

  // DOCUMENT
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentType, setDocumentType] = useState("lecon");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // EXERCICE
  const [exerciseTitle, setExerciseTitle] = useState("");
  const [exerciseDescription, setExerciseDescription] = useState("");
  const [exerciseInstructions, setExerciseInstructions] = useState("");
  const [exerciseClassId, setExerciseClassId] = useState("");
  const [exerciseSubjectId, setExerciseSubjectId] = useState("");
  const [duration, setDuration] = useState("");

  const [questions, setQuestions] = useState([
    {
      question: "",
      question_type: "text",
      options: "",
      correct_answer: "",
      points: 1
    }
  ]);

  const [savingExercise, setSavingExercise] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [
      documentsResult,
      classesResult,
      subjectsResult,
      exercisesResult
    ] = await Promise.all([
      supabase
        .from("documents")
        .select("*")
        .eq("teacher_id", session.user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("classes")
        .select("*")
        .order("name"),

      supabase
        .from("subjects")
        .select("*")
        .order("name"),

      supabase
        .from("exercises")
        .select("*")
        .eq("teacher_id", session.user.id)
        .order("created_at", { ascending: false })
    ]);

    if (documentsResult.data) {
      setDocuments(documentsResult.data);
    }

    if (classesResult.data) {
      setClasses(classesResult.data);
    }

    if (subjectsResult.data) {
      setSubjects(subjectsResult.data);
    }

    if (exercisesResult.data) {
      setExercises(exercisesResult.data);
    }

    setLoading(false);
  }

  // =========================
  // DOCUMENTS
  // =========================

  async function publishDocument() {
    setMessage("");

    if (!title.trim()) {
      setMessage("Veuillez saisir un titre.");
      return;
    }

    if (!classId) {
      setMessage("Veuillez choisir une classe.");
      return;
    }

    if (!subjectId) {
      setMessage("Veuillez choisir une matière.");
      return;
    }

    if (!file) {
      setMessage("Veuillez choisir un fichier.");
      return;
    }

    setUploading(true);

    try {
      const filePath =
        `${session.user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } =
        await supabase.storage
          .from("school-documents")
          .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("school-documents")
          .getPublicUrl(filePath);

      const { error: insertError } =
        await supabase
          .from("documents")
          .insert({
            teacher_id: session.user.id,
            class_id: classId,
            subject_id: Number(subjectId),
            title: title.trim(),
            description: description.trim(),
            document_type: documentType,
            file_url: publicUrlData.publicUrl
          });

      if (insertError) {
        throw insertError;
      }

      setMessage("Document publié avec succès !");

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
      setMessage("Erreur : " + error.message);

    } finally {
      setUploading(false);
    }
  }

  // =========================
  // QUESTIONS
  // =========================

  function addQuestion() {
    setQuestions([
      ...questions,
      {
        question: "",
        question_type: "text",
        options: "",
        correct_answer: "",
        points: 1
      }
    ]);
  }

  function removeQuestion(index) {
    if (questions.length === 1) {
      return;
    }

    setQuestions(
      questions.filter((_, i) => i !== index)
    );
  }

  function updateQuestion(index, field, value) {
    const updated = [...questions];

    updated[index] = {
      ...updated[index],
      [field]: value
    };

    setQuestions(updated);
  }

  // =========================
  // CREER EXERCICE
  // =========================

  async function saveExercise(published) {
    setMessage("");

    if (!exerciseTitle.trim()) {
      setMessage("Veuillez saisir le titre de l'exercice.");
      return;
    }

    if (!exerciseClassId) {
      setMessage("Veuillez choisir une classe.");
      return;
    }

    if (!exerciseSubjectId) {
      setMessage("Veuillez choisir une matière.");
      return;
    }

    for (const item of questions) {
      if (!item.question.trim()) {
        setMessage("Toutes les questions doivent être remplies.");
        return;
      }

      if (!item.correct_answer.trim()) {
        setMessage("Veuillez indiquer la réponse correcte.");
        return;
      }
    }

    setSavingExercise(true);

    try {
      // Récupérer l'école du professeur
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("school_id")
          .eq("id", session.user.id)
          .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.school_id) {
        throw new Error(
          "Votre profil professeur n'est associé à aucune école."
        );
      }

      // Créer l'exercice
      const { data: exercise, error: exerciseError } =
        await supabase
          .from("exercises")
          .insert({
            teacher_id: session.user.id,
            school_id: profile.school_id,
            class_id: exerciseClassId,
            subject_id: Number(exerciseSubjectId),
            title: exerciseTitle.trim(),
            description: exerciseDescription.trim(),
            instructions: exerciseInstructions.trim(),
            duration_minutes:
              duration
                ? Number(duration)
                : null,
            published: published
          })
          .select()
          .single();

      if (exerciseError) {
        throw exerciseError;
      }

      // Préparer les questions
      const questionRows = questions.map(
        (item, index) => ({
          exercise_id: exercise.id,
          question: item.question.trim(),
          question_type: item.question_type,
          options:
            item.question_type === "qcm"
              ? item.options
                  .split(",")
                  .map((option) => option.trim())
                  .filter(Boolean)
              : null,
          correct_answer:
            item.correct_answer.trim(),
          points:
            Number(item.points) || 1,
          position: index
        })
      );

      const { error: questionsError } =
        await supabase
          .from("exercise_questions")
          .insert(questionRows);

      if (questionsError) {
        // Supprimer l'exercice si les questions échouent
        await supabase
          .from("exercises")
          .delete()
          .eq("id", exercise.id);

        throw questionsError;
      }

      setMessage(
        published
          ? "🎉 Exercice publié avec succès !"
          : "💾 Exercice enregistré comme brouillon."
      );

      // Réinitialisation
      setExerciseTitle("");
      setExerciseDescription("");
      setExerciseInstructions("");
      setExerciseClassId("");
      setExerciseSubjectId("");
      setDuration("");

      setQuestions([
        {
          question: "",
          question_type: "text",
          options: "",
          correct_answer: "",
          points: 1
        }
      ]);

      setShowExerciseForm(false);

      await loadData();

    } catch (error) {
      console.error(error);
      setMessage("Erreur : " + error.message);

    } finally {
      setSavingExercise(false);
    }
  }

  if (loading) {
    return (
      <div className="center">
        Chargement de l'espace professeur…
      </div>
    );
  }

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
              {classes.length}
            </strong>

            <span>
              Classes
            </span>
          </div>

          <div className="stat">
            <strong>
              {subjects.length}
            </strong>

            <span>
              Matières
            </span>
          </div>

        </div>

        {/* MESSAGE */}

        {message && (
          <p className="message">
            {message}
          </p>
        )}

        {/* =========================
            EXERCICES
        ========================= */}

        <div className="notice">

          <h2>
            📝 Exercices
          </h2>

          <p>
            Créez des exercices interactifs
            pour vos élèves.
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

              {classes.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
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

              {subjects.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>

            <label>
              Titre de l'exercice
            </label>

            <input
              type="text"
              placeholder="Ex : Les fractions"
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
              placeholder="Décrivez l'exercice..."
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
              placeholder="Ex : Répondez à toutes les questions."
              value={exerciseInstructions}
              onChange={(e) =>
                setExerciseInstructions(
                  e.target.value
                )
              }
            />

            <label>
              Durée en minutes
            </label>

            <input
              type="number"
              min="1"
              placeholder="Ex : 30"
              value={duration}
              onChange={(e) =>
                setDuration(
                  e.target.value
                )
              }
            />

            <hr />

            <h3>
              Questions
            </h3>

            {questions.map(
              (item, index) => (
                <div
                  key={index}
                  className="card"
                >

                  <h3>
                    Question {index + 1}
                  </h3>

                  <label>
                    Question
                  </label>

                  <textarea
                    placeholder="Écrivez la question..."
                    value={item.question}
                    onChange={(e) =>
                      updateQuestion(
                        index,
                        "question",
                        e.target.value
                      )
                    }
                  />

                  <label>
                    Type de question
                  </label>

                  <select
                    value={
                      item.question_type
                    }
                    onChange={(e) =>
                      updateQuestion(
                        index,
                        "question_type",
                        e.target.value
                      )
                    }
                  >
                    <option value="text">
                      Réponse libre
                    </option>

                    <option value="qcm">
                      QCM
                    </option>

                    <option value="vrai_faux">
                      Vrai / Faux
                    </option>
                  </select>

                  {item.question_type ===
                    "qcm" && (
                    <>
                      <label>
                        Choix de réponses
                      </label>

                      <input
                        type="text"
                        placeholder="Ex : Paris, Dakar, Londres"
                        value={item.options}
                        onChange={(e) =>
                          updateQuestion(
                            index,
                            "options",
                            e.target.value
                          )
                        }
                      />
                    </>
                  )}

                  <label>
                    Réponse correcte
                  </label>

                  <input
                    type="text"
                    placeholder="Réponse correcte"
                    value={
                      item.correct_answer
                    }
                    onChange={(e) =>
                      updateQuestion(
                        index,
                        "correct_answer",
                        e.target.value
                      )
                    }
                  />

                  <label>
                    Points
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={item.points}
                    onChange={(e) =>
                      updateQuestion(
                        index,
                        "points",
                        e.target.value
                      )
                    }
                  />

                  {questions.length > 1 && (
                    <button
                      className="secondary"
                      onClick={() =>
                        removeQuestion(index)
                      }
                    >
                      🗑️ Supprimer la question
                    </button>
                  )}

                </div>
              )
            )}

            <button
              className="secondary"
              onClick={addQuestion}
            >
              + Ajouter une question
            </button>

            <br />
            <br />

            <button
              onClick={() =>
                saveExercise(false)
              }
              disabled={savingExercise}
            >
              💾 Enregistrer brouillon
            </button>

            <button
              onClick={() =>
                saveExercise(true)
              }
              disabled={savingExercise}
            >
              {savingExercise
                ? "Enregistrement..."
                : "📢 Publier l'exercice"}
            </button>

          </div>
        )}

        {/* =========================
            MES EXERCICES
        ========================= */}

        <div className="notice">

          <h2>
            📚 Mes exercices
          </h2>

          {exercises.length === 0 ? (
            <p>
              Vous n'avez encore créé aucun exercice.
            </p>
          ) : (
            exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="stat"
              >

                <strong>
                  {exercise.title}
                </strong>

                <span>
                  {exercise.published
                    ? "🟢 Publié"
                    : "🟡 Brouillon"}
                </span>

              </div>
            ))
          )}

        </div>

        {/* =========================
            DOCUMENTS
        ========================= */}

        <div className="notice">

          <h2>
            📚 Documents
          </h2>

          <p>
            Partagez vos leçons, cours,
            exercices et devoirs avec vos élèves.
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

              {classes.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
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

              {subjects.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>

            <label>
              Titre
            </label>

            <input
              type="text"
              placeholder="Ex : Les fractions"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
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
                  e.target.files?.[0] || null
                )
              }
            />

            <button
              onClick={publishDocument}
              disabled={uploading}
            >
              {uploading
                ? "Publication en cours..."
                : "📤 Publier"}
            </button>

          </div>
        )}

        {/* PUBLICATIONS */}

        <div className="notice">

          <h2>
            📖 Mes publications
          </h2>

          {documents.length === 0 ? (
            <p>
              Vous n'avez encore publié aucun document.
            </p>
          ) : (
            documents.map((document) => (
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
            ))
          )}

        </div>

      </section>
    </main>
  );
}
