import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function StudentDashboard({
  session,
  onLogout,
}) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [profile, setProfile] = useState(null);
  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [classe, setClasse] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [activeSection, setActiveSection] =
    useState("dashboard");

  const studentId = session?.user?.id;

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    }
  }, [session]);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      /*
       * =====================================================
       * PROFIL
       * =====================================================
       */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      setProfile(profileData);

      /*
       * =====================================================
       * ÉLÈVE
       *
       * On cherche l'élève correspondant à l'utilisateur
       * connecté.
       *
       * Dans ton projet, students.id est normalement
       * différent de profiles.id.
       *
       * On essaie donc d'abord plusieurs possibilités.
       * =====================================================
       */

      let studentData = null;

      const {
        data: byProfileId,
        error: studentProfileError,
      } = await supabase
        .from("students")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (
        !studentProfileError &&
        byProfileId
      ) {
        studentData = byProfileId;
      }

      /*
       * Si students.id n'est pas lié directement
       * au compte Supabase, on cherche avec
       * student_code ou d'autres informations disponibles.
       */

      if (!studentData && profileData?.full_name) {
        const {
          data: studentsByName,
        } = await supabase
          .from("students")
          .select("*")
          .eq(
            "first_name",
            profileData.full_name
          )
          .limit(1);

        if (
          studentsByName &&
          studentsByName.length > 0
        ) {
          studentData =
            studentsByName[0];
        }
      }

      /*
       * Si aucun élève n'est trouvé, on garde
       * quand même l'espace étudiant fonctionnel.
       */

      setStudent(studentData);

      /*
       * =====================================================
       * ÉCOLE
       * =====================================================
       */

      if (studentData?.school_id) {
        const {
          data: schoolData,
          error: schoolError,
        } = await supabase
          .from("schools")
          .select("*")
          .eq(
            "id",
            studentData.school_id
          )
          .maybeSingle();

        if (schoolError) {
          console.warn(
            "Erreur école :",
            schoolError
          );
        }

        setSchool(schoolData || null);
      }

      /*
       * =====================================================
       * CLASSE
       * =====================================================
       */

      if (studentData?.class_id) {
        const {
          data: classData,
          error: classError,
        } = await supabase
          .from("classes")
          .select("*")
          .eq(
            "id",
            studentData.class_id
          )
          .maybeSingle();

        if (classError) {
          console.warn(
            "Erreur classe :",
            classError
          );
        }

        setClasse(classData || null);
      }

      /*
       * =====================================================
       * DOCUMENTS
       * =====================================================
       */

      if (studentData?.class_id) {
        const {
          data: documentData,
          error: documentError,
        } = await supabase
          .from("documents")
          .select("*")
          .eq(
            "class_id",
            studentData.class_id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (documentError) {
          console.warn(
            "Erreur documents :",
            documentError
          );
        }

        setDocuments(
          documentData || []
        );
      } else {
        setDocuments([]);
      }

      /*
       * =====================================================
       * EXERCICES
       * =====================================================
       */

      if (studentData?.class_id) {
        const {
          data: exerciseData,
          error: exerciseError,
        } = await supabase
          .from("exercises")
          .select("*")
          .eq(
            "class_id",
            studentData.class_id
          )
          .eq(
            "published",
            true
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (exerciseError) {
          console.warn(
            "Erreur exercices :",
            exerciseError
          );
        }

        setExercises(
          exerciseData || []
        );

        /*
         * =================================================
         * QUESTIONS
         * =================================================
         */

        if (
          exerciseData &&
          exerciseData.length > 0
        ) {
          const exerciseIds =
            exerciseData.map(
              (exercise) =>
                exercise.id
            );

          const {
            data: questionData,
            error: questionError,
          } = await supabase
            .from("questions")
            .select("*")
            .in(
              "exercise_id",
              exerciseIds
            )
            .order(
              "position",
              {
                ascending: true,
              }
            );

          if (questionError) {
            console.warn(
              "Erreur questions :",
              questionError
            );
          }

          setQuestions(
            questionData || []
          );
        } else {
          setQuestions([]);
        }
      } else {
        setExercises([]);
        setQuestions([]);
      }
    } catch (error) {
      console.error(
        "Erreur StudentDashboard :",
        error
      );

      setMessage(
        "Impossible de charger votre espace élève : " +
          (error?.message ||
            "Erreur inconnue")
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * UTILITAIRES
   * =========================================================
   */

  function formatDate(date) {
    if (!date) {
      return "Date inconnue";
    }

    try {
      return new Date(
        date
      ).toLocaleDateString(
        "fr-FR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );
    } catch {
      return date;
    }
  }

  function getStudentName() {
    if (!student) {
      return (
        profile?.full_name ||
        session?.user?.email ||
        "Élève"
      );
    }

    return (
      `${student.first_name || ""} ${
        student.last_name || ""
      }`.trim() ||
      profile?.full_name ||
      "Élève"
    );
  }

  function getDocumentType(document) {
    return (
      document.document_type ||
      "Document"
    );
  }

  /*
   * =========================================================
   * STATISTIQUES
   * =========================================================
   */

  const stats = useMemo(
    () => ({
      documents:
        documents.length,
      exercises:
        exercises.length,
      questions:
        questions.length,
    }),
    [
      documents,
      exercises,
      questions,
    ]
  );

  /*
   * =========================================================
   * NAVIGATION
   * =========================================================
   */

  function openSection(section) {
    setActiveSection(section);
    setMessage("");
  }

  function renderNavigation() {
    const items = [
      [
        "dashboard",
        "🏠 Accueil",
      ],
      [
        "profile",
        "👤 Mon profil",
      ],
      [
        "documents",
        "📚 Mes cours",
      ],
      [
        "exercises",
        "📝 Exercices",
      ],
      [
        "questions",
        "❓ Questions",
      ],
      [
        "chat",
        "💬 Chat professeur",
      ],
    ];

    return (
      <div className="notice">
        <h2>
          🎓 Mon espace élève
        </h2>

        <div className="grid">
          {items.map(
            ([section, label]) => (
              <button
                key={section}
                onClick={() =>
                  openSection(
                    section
                  )
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

  /*
   * =========================================================
   * ACCUEIL
   * =========================================================
   */

  function renderDashboard() {
    return (
      <>
        <div className="notice">
          <h2>
            👋 Bonjour{" "}
            {getStudentName()} !
          </h2>

          <p>
            Bienvenue dans ton espace
            École Connectée.
          </p>

          {school && (
            <p>
              🏫{" "}
              <strong>
                {school.name}
              </strong>
            </p>
          )}

          {classe && (
            <p>
              📚 Classe :{" "}
              <strong>
                {classe.name}
                {classe.level
                  ? ` — ${classe.level}`
                  : ""}
              </strong>
            </p>
          )}
        </div>

        <div className="grid">
          <div className="stat">
            <strong>
              {stats.documents}
            </strong>

            <span>
              📚 Cours disponibles
            </span>
          </div>

          <div className="stat">
            <strong>
              {stats.exercises}
            </strong>

            <span>
              📝 Exercices
            </span>
          </div>

          <div className="stat">
            <strong>
              {stats.questions}
            </strong>

            <span>
              ❓ Questions
            </span>
          </div>
        </div>

        <div className="notice">
          <h2>
            🚀 Accès rapide
          </h2>

          <p>
            Consulte tes cours,
            ouvre tes exercices ou
            échange avec ton
            professeur.
          </p>

          <div className="grid">
            <button
              onClick={() =>
                openSection(
                  "documents"
                )
              }
            >
              📚 Voir mes cours
            </button>

            <button
              onClick={() =>
                openSection(
                  "exercises"
                )
              }
            >
              📝 Mes exercices
            </button>

            <button
              onClick={() =>
                openSection(
                  "chat"
                )
              }
            >
              💬 Contacter mon professeur
            </button>
          </div>
        </div>
      </>
    );
  }

  /*
   * =========================================================
   * PROFIL
   * =========================================================
   */

  function renderProfile() {
    return (
      <>
        <div className="notice">
          <h2>
            👤 Mon profil
          </h2>

          <p>
            Informations de ton
            compte élève.
          </p>
        </div>

        <div className="grid">
          <div className="stat">
            <strong>
              👨‍🎓 Élève
            </strong>

            <span>
              Nom :{" "}
              {getStudentName()}
            </span>

            <span>
              E-mail :{" "}
              {session?.user?.email ||
                "Non renseigné"}
            </span>

            <span>
              Téléphone :{" "}
              {student?.phone ||
                profile?.phone ||
                "Non renseigné"}
            </span>

            <span>
              Matricule :{" "}
              {student?.student_code ||
                "Non renseigné"}
            </span>

            <span>
              Statut :{" "}
              {student?.active ===
              false
                ? "🔴 Inactif"
                : "🟢 Actif"}
            </span>
          </div>

          <div className="stat">
            <strong>
              🏫 Scolarité
            </strong>

            <span>
              École :{" "}
              {school?.name ||
                "Non renseignée"}
            </span>

            <span>
              Classe :{" "}
              {classe?.name ||
                "Non affectée"}
            </span>

            {classe?.level && (
              <span>
                Niveau :{" "}
                {classe.level}
              </span>
            )}
          </div>
        </div>
      </>
    );
  }

  /*
   * =========================================================
   * DOCUMENTS / COURS
   * =========================================================
   */

  function renderDocuments() {
    return (
      <>
        <div className="notice">
          <h2>
            📚 Mes cours
          </h2>

          <p>
            {documents.length}{" "}
            document
            {documents.length > 1
              ? "s"
              : ""}{" "}
            disponible
            {documents.length > 1
              ? "s"
              : ""}.
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="notice">
            Aucun cours n'est
            disponible pour le
            moment.
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
                    {document.title ||
                      "Document sans titre"}
                  </strong>

                  <span>
                    Type :{" "}
                    {getDocumentType(
                      document
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

                  {document.file_url ? (
                    <a
                      href={
                        document.file_url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      📥 Ouvrir le cours
                    </a>
                  ) : (
                    <span>
                      📄 Aucun fichier
                      associé
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

  /*
   * =========================================================
   * EXERCICES
   * =========================================================
   */

  function renderExercises() {
    return (
      <>
        <div className="notice">
          <h2>
            📝 Mes exercices
          </h2>

          <p>
            {exercises.length}{" "}
            exercice
            {exercises.length > 1
              ? "s"
              : ""}{" "}
            disponible
            {exercises.length > 1
              ? "s"
              : ""}.
          </p>
        </div>

        {exercises.length === 0 ? (
          <div className="notice">
            Aucun exercice publié
            pour ta classe.
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
                      {exercise.title ||
                        "Exercice"}
                    </strong>

                    <span>
                      ❓ Questions :{" "}
                      {
                        exerciseQuestions.length
                      }
                    </span>

                    <span>
                      ⏱️ Durée :{" "}
                      {
                        exercise.duration_minutes ||
                        0
                      }{" "}
                      min
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
                        📌{" "}
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

                    <button
                      onClick={() =>
                        openSection(
                          "questions"
                        )
                      }
                    >
                      ❓ Voir les questions
                    </button>
                  </div>
                );
              }
            )}
          </div>
        )}
      </>
    );
  }

  /*
   * =========================================================
   * QUESTIONS
   * =========================================================
   */

  function renderQuestions() {
    return (
      <>
        <div className="notice">
          <h2>
            ❓ Questions
          </h2>

          <p>
            Questions associées à
            tes exercices.
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="notice">
            Aucune question
            disponible pour le
            moment.
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
                    {question.question ||
                      "Question sans texte"}
                  </span>

                  <span>
                    Type :{" "}
                    {
                      question.question_type ||
                      "Non renseigné"
                    }
                  </span>

                  <span>
                    Points :{" "}
                    {question.points ||
                      0}
                  </span>

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

  /*
   * =========================================================
   * CHAT
   * =========================================================
   *
   * Pour le moment, on prépare l'espace.
   * Nous connecterons ensuite cette partie à une vraie
   * table messages Supabase.
   */

  function renderChat() {
    return (
      <div className="notice">
        <h2>
          💬 Chat avec mon professeur
        </h2>

        <p>
          Cette fonctionnalité
          permettra bientôt de
          discuter directement avec
          ton professeur.
        </p>

        <div className="stat">
          <strong>
            💬 Messagerie
          </strong>

          <span>
            Envoi et réception de
            messages.
          </span>

          <span>
            📎 Possibilité d'envoyer
            des documents.
          </span>

          <span>
            🔔 Notifications des
            nouveaux messages.
          </span>

          <span>
            👨‍🏫 Discussion avec le
            professeur de ta classe.
          </span>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * SECTION ACTIVE
   * =========================================================
   */

  function renderActiveSection() {
    switch (activeSection) {
      case "profile":
        return renderProfile();

      case "documents":
        return renderDocuments();

      case "exercises":
        return renderExercises();

      case "questions":
        return renderQuestions();

      case "chat":
        return renderChat();

      default:
        return renderDashboard();
    }
  }

  /*
   * =========================================================
   * CHARGEMENT
   * =========================================================
   */

  if (loading) {
    return (
      <div className="center">
        ⏳ Chargement de ton
        espace élève…
      </div>
    );
  }

  /*
   * =========================================================
   * AFFICHAGE
   * =========================================================
   */

  return (
    <main className="page">
      <section className="card dashboard">
        <div className="top">
          <div>
            <p className="eyebrow">
              ÉCOLE CONNECTÉE
            </p>

            <h1>
              Espace Élève 🎓
            </h1>

            <p>
              {getStudentName()}
            </p>

            {classe && (
              <p className="small">
                📚{" "}
                {classe.name}
                {classe.level
                  ? ` — ${classe.level}`
                  : ""}
              </p>
            )}
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
              ← Retour à l'accueil
            </button>
          </div>
        )}

        {renderActiveSection()}
      </section>
    </main>
  );
}
