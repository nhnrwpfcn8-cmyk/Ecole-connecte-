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

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Formulaire professeur
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [creatingTeacher, setCreatingTeacher] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
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
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "teacher"),

        supabase
          .from("students")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "parent"),

        supabase
          .from("schools")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("classes")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("subjects")
          .select("id", { count: "exact", head: true }),
      ]);

      const errors = [
        teachersResult.error,
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
        teachers: teachersResult.count || 0,
        students: studentsResult.count || 0,
        parents: parentsResult.count || 0,
        schools: schoolsResult.count || 0,
        classes: classesResult.count || 0,
        subjects: subjectsResult.count || 0,
      });
    } catch (error) {
      console.error("Erreur statistiques:", error);

      setMessage(
        "Impossible de charger les statistiques : " +
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
      setMessage("Veuillez saisir le nom complet du professeur.");
      return;
    }

    if (!cleanEmail) {
      setMessage("Veuillez saisir l'adresse e-mail du professeur.");
      return;
    }

    setCreatingTeacher(true);

    try {
      const {
        data,
        error,
      } = await supabase.functions.invoke("create-user", {
        body: {
          email: cleanEmail,
          full_name: cleanName,
          phone: cleanPhone,
          role: "teacher",
        },
      });

      if (error) {
        console.error(
          "Erreur création professeur:",
          error
        );

        throw new Error(
          error.message ||
          "Impossible de créer le compte professeur."
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.error ||
          "La création du compte a échoué."
        );
      }

      setMessage(
        "✅ Le compte professeur a été créé avec succès."
      );

      setTeacherName("");
      setTeacherEmail("");
      setTeacherPhone("");

      setShowTeacherForm(false);

      await loadStats();
    } catch (error) {
      console.error(error);

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

        {/* EN-TÊTE */}
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

        {/* PRÉSENTATION */}
        <div className="notice">

          <h2>
            Gestion de l'école
          </h2>

          <p>
            Depuis cet espace, l'administrateur peut
            gérer les professeurs, élèves, parents,
            écoles, classes et matières.
          </p>

        </div>

        {/* GESTION DES PROFESSEURS */}
        <div className="notice">

          <h2>
            👨‍🏫 Gestion des professeurs
          </h2>

          <p>
            Créez les comptes des professeurs
            directement depuis votre espace
            administrateur.
          </p>

          <button
            onClick={() =>
              setShowTeacherForm(!showTeacherForm)
            }
          >
            {showTeacherForm
              ? "Fermer"
              : "+ Ajouter un professeur"}
          </button>

        </div>

        {/* FORMULAIRE PROFESSEUR */}
        {showTeacherForm && (
          <div className="card">

            <h2>
              Nouveau professeur
            </h2>

            <p>
              Renseignez les informations du professeur.
            </p>

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
                ? "Création du compte..."
                : "👨‍🏫 Créer le compte professeur"}
            </button>

          </div>
        )}

        {/* AUTRES GESTIONS */}
        <div className="grid">

          <button
            onClick={() =>
              alert(
                "La gestion des élèves sera disponible prochainement."
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
                "La gestion des parents sera disponible prochainement."
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
                "La gestion des écoles sera disponible prochainement."
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
                "La gestion des classes sera disponible prochainement."
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
                "La gestion des matières sera disponible prochainement."
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
