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
        "Impossible de charger les statistiques : " + error.message
      );
    } finally {
      setLoading(false);
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

        {message && (
          <p className="message">
            {message}
          </p>
        )}

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

        </div>

        <div className="notice">
          <h2>
            Gestion de l'école
          </h2>

          <p>
            Depuis cet espace, l'administrateur pourra
            créer et gérer les professeurs, élèves,
            parents, écoles, classes et matières.
          </p>
        </div>

        <div className="grid">

          <button onClick={() => alert("Gestion des professeurs")}>
            👨‍🏫
            <br />
            Gérer les professeurs
          </button>

          <button onClick={() => alert("Gestion des élèves")}>
            👨‍🎓
            <br />
            Gérer les élèves
          </button>

          <button onClick={() => alert("Gestion des parents")}>
            👨‍👩‍👧
            <br />
            Gérer les parents
          </button>

          <button onClick={() => alert("Gestion des écoles")}>
            🏫
            <br />
            Gérer les écoles
          </button>

          <button onClick={() => alert("Gestion des classes")}>
            📚
            <br />
            Gérer les classes
          </button>

          <button onClick={() => alert("Gestion des matières")}>
            📖
            <br />
            Gérer les matières
          </button>

        </div>

      </section>
    </main>
  );
}
