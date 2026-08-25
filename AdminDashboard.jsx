import React, { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function AdminDashboard({
  session,
  onLogout,
}) {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    parents: 0,
    schools: 0,
    classes: 0,
    subjects: 0,
  });

  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creatingTeacher, setCreatingTeacher] =
    useState(false);

  const [showTeacherForm, setShowTeacherForm] =
    useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const [teacherName, setTeacherName] =
    useState("");

  const [teacherEmail, setTeacherEmail] =
    useState("");

  const [teacherPhone, setTeacherPhone] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      /*
       * PROFESSEURS
       */

      const teachersResponse =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, phone, role"
          )
          .eq("role", "teacher")
          .order("full_name");

      if (teachersResponse.error) {
        throw teachersResponse.error;
      }

      const teacherList =
        teachersResponse.data || [];

      setTeachers(teacherList);

      /*
       * ÉLÈVES
       */

      const studentsResponse =
        await supabase
          .from("students")
          .select("id", {
            count: "exact",
            head: true,
          });

      if (studentsResponse.error) {
        throw studentsResponse.error;
      }

      /*
       * PARENTS
       */

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

      /*
       * ÉCOLES
       */

      const schoolsResponse =
        await supabase
          .from("schools")
          .select("id", {
            count: "exact",
            head: true,
          });

      if (schoolsResponse.error) {
        throw schoolsResponse.error;
      }

      /*
       * CLASSES
       */

      const classesResponse =
        await supabase
          .from("classes")
          .select("id", {
            count: "exact",
            head: true,
          });

      if (classesResponse.error) {
        throw classesResponse.error;
      }

      /*
       * MATIÈRES
       */

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

      setStats({
        teachers: teacherList.length,
        students: studentsResponse.count || 0,
        parents: parentsResponse.count || 0,
        schools: schoolsResponse.count || 0,
        classes: classesResponse.count || 0,
        subjects: subjectsResponse.count || 0,
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

  async function createTeacher() {
    setMessage("");
    setErrorMessage("");

    const cleanName =
      teacherName.trim();

    const cleanEmail =
      teacherEmail.trim().toLowerCase();

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
      /*
       * Appel de l'Edge Function
       */

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
        console.error(
          "Erreur Edge Function:",
          error
        );

        throw new Error(
          error.message ||
            "Impossible de contacter le serveur."
        );
      }

      /*
       * Vérifier la réponse de la fonction
       */

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "La création du professeur a échoué."
        );
      }

      /*
       * Succès
       */

      setMessage(
        "Professeur créé avec succès ! Un lien de connexion pourra lui être envoyé."
      );

      /*
       * Réinitialiser le formulaire
       */

      setTeacherName("");
      setTeacherEmail("");
      setTeacherPhone("");

      /*
       * Fermer le formulaire
       */

      setShowTeacherForm(false);

      /*
       * Recharger les données
       */

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

  async function refreshTeachers() {
    setMessage("");
    setErrorMessage("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, role"
        )
        .eq("role", "teacher")
        .order("full_name");

      if (error) {
        throw error;
      }

      const list = data || [];

      setTeachers(list);

      setStats((previous) => ({
        ...previous,
        teachers: list.length,
      }));

    } catch (error) {
      console.error(
        "Erreur actualisation professeurs:",
        error
      );

      setErrorMessage(
        error.message ||
          "Impossible d'actualiser les professeurs."
      );
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

        {/* =========================
            MESSAGES
        ========================== */}

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

        {/* =========================
            GESTION DE L'ÉCOLE
        ========================== */}

        <div className="notice">

          <h2>
            Gestion de l'école
          </h2>

          <p>
            Depuis cet espace, l'administrateur
            peut gérer les professeurs, élèves,
            parents, écoles, classes et matières.
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
                  : ""} enregistré
                {teachers.length !== 1
                  ? "s"
                  : ""}
              </p>

            </div>

            <button
              onClick={() =>
                setShowTeacherForm(
                  !showTeacherForm
                )
              }
            >
              {showTeacherForm
                ? "Fermer"
                : "+ Nouveau professeur"}
            </button>

          </div>

          {/* =========================
              FORMULAIRE PROFESSEUR
          ========================== */}

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
                disabled={creatingTeacher}
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
                disabled={creatingTeacher}
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
                disabled={creatingTeacher}
              />

              <button
                onClick={createTeacher}
                disabled={creatingTeacher}
              >
                {creatingTeacher
                  ? "Création en cours..."
                  : "👨‍🏫 Créer le professeur"}
              </button>

            </div>

          )}

          {/* =========================
              LISTE DES PROFESSEURS
          ========================== */}

          <div
            style={{
              marginTop: "20px",
            }}
          >

            <button
              onClick={refreshTeachers}
            >
              ↻ Actualiser la liste
            </button>

          </div>

          {teachers.length === 0 ? (

            <p>
              Aucun professeur affiché.
            </p>

          ) : (

            <div
              style={{
                marginTop: "20px",
              }}
            >

              {teachers.map((teacher) => (

                <div
                  key={teacher.id}
                  className="stat"
                  style={{
                    marginBottom: "12px",
                  }}
                >

                  <strong>
                    {teacher.full_name ||
                      "Nom non renseigné"}
                  </strong>

                  <span>
                    Téléphone :{" "}
                    {teacher.phone ||
                      "Non renseigné"}
                  </span>

                  <span>
                    Rôle :{" "}
                    {teacher.role}
                  </span>

                </div>

              ))}

            </div>

          )}

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
              alert(
                "La gestion des élèves sera ajoutée prochainement."
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
