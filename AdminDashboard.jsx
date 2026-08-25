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

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showTeacherForm, setShowTeacherForm] =
    useState(false);

  const [showTeachers, setShowTeachers] =
    useState(false);

  const [teacherName, setTeacherName] =
    useState("");

  const [teacherEmail, setTeacherEmail] =
    useState("");

  const [teacherPhone, setTeacherPhone] =
    useState("");

  const [creatingTeacher, setCreatingTeacher] =
    useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      // Charger les professeurs directement
      const {
        data: teachersData,
        error: teachersError,
      } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role")
        .eq("role", "teacher")
        .order("full_name");

      if (teachersError) {
        throw teachersError;
      }

      setTeachers(teachersData || []);

      // Charger les autres statistiques
      const [
        studentsResult,
        parentsResult,
        schoolsResult,
        classesResult,
        subjectsResult,
      ] = await Promise.all([
        supabase
          .from("students")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
  .from("profiles")
  .select("id", { count: "exact" })
  .eq("role", "teacher"),
          })
          .eq("role", "parent"),

        supabase
          .from("schools")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("classes")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("subjects")
          .select("id", {
            count: "exact",
            head: true,
          }),
      ]);

      const errors = [
        studentsResult.error,
        parentsResult.error,
        schoolsResult.error,
        classesResult.error,
        subjectsResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw errors[0];
      }

      setStats({
        teachers: teachersData?.length || 0,
        students: studentsResult.count || 0,
        parents: parentsResult.count || 0,
        schools: schoolsResult.count || 0,
        classes: classesResult.count || 0,
        subjects: subjectsResult.count || 0,
      });

    } catch (error) {
      console.error(
        "Erreur chargement administration:",
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

  async function createTeacher() {
    setMessage("");

    const cleanName = teacherName.trim();
    const cleanEmail = teacherEmail.trim();
    const cleanPhone = teacherPhone.trim();

    if (!cleanName) {
      setMessage(
        "Veuillez saisir le nom complet du professeur."
      );
      return;
    }

    if (!cleanEmail) {
      setMessage(
        "Veuillez saisir l'adresse e-mail du professeur."
      );
      return;
    }

    setCreatingTeacher(true);

    try {
      const {
        data,
        error,
      } = await supabase.functions.invoke(
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
        throw new Error(error.message);
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

      setTeacherName("");
      setTeacherEmail("");
      setTeacherPhone("");

      setShowTeacherForm(false);

      // Recharger immédiatement les données
      await loadData();

    } catch (error) {
      console.error(
        "Erreur création professeur:",
        error
      );

      setMessage(
        "Erreur : " + error.message
      );
    } finally {
      setCreatingTeacher(false);
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

        {/* HEADER */}

        <div className="top">

          <div>

            <p className="eyebrow">
              ÉCOLE CONNECTÉE
            </p>

            <h1>
              Administration 🛠️
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

        {/* MESSAGE */}

        {message && (
          <p className="message">
            {message}
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
            Depuis cet espace, l'administrateur
            peut gérer les différents utilisateurs
            et les ressources de l'école.
          </p>

        </div>

        {/* PROFESSEURS */}

        <div className="notice">

          <h2>
            👨‍🏫 Gestion des professeurs
          </h2>

          <p>
            {teachers.length} professeur(s)
            enregistré(s).
          </p>

          <button
            onClick={() =>
              setShowTeacherForm(
                !showTeacherForm
              )
            }
          >
            {showTeacherForm
              ? "Fermer"
              : "+ Ajouter un professeur"}
          </button>

          <button
            className="secondary"
            onClick={() =>
              setShowTeachers(
                !showTeachers
              )
            }
          >
            {showTeachers
              ? "Masquer les professeurs"
              : "Voir les professeurs"}
          </button>

        </div>

        {/* FORMULAIRE */}

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
            />

            <button
              onClick={createTeacher}
              disabled={creatingTeacher}
            >
              {creatingTeacher
                ? "Création en cours..."
                : "👨‍🏫 Créer le compte professeur"}
            </button>

          </div>

        )}

        {/* LISTE PROFESSEURS */}

        {showTeachers && (

          <div className="notice">

            <h2>
              Liste des professeurs
            </h2>

            {teachers.length === 0 ? (

              <p>
                Aucun professeur trouvé.
              </p>

            ) : (

              teachers.map((teacher) => (

                <div
                  key={teacher.id}
                  className="stat"
                >

                  <strong>
                    {teacher.full_name ||
                      "Nom non renseigné"}
                  </strong>

                  <span>
                    {teacher.phone ||
                      "Téléphone non renseigné"}
                  </span>

                </div>

              ))

            )}

          </div>

        )}

        {/* AUTRES MODULES */}

        <div className="grid">

          <button
            onClick={() =>
              alert(
                "Gestion des élèves prochainement disponible."
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
                "Gestion des parents prochainement disponible."
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
                "Gestion des écoles prochainement disponible."
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
                "Gestion des classes prochainement disponible."
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
                "Gestion des matières prochainement disponible."
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
