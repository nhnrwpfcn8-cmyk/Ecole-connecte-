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
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      /*
       * PROFESSEURS
       */

      const teachersResult = await supabase
        .from("profiles")
        .select("id, full_name, phone, role")
        .eq("role", "teacher")
        .order("full_name");

      if (teachersResult.error) {
        console.error(
          "Erreur professeurs:",
          teachersResult.error
        );

        throw teachersResult.error;
      }

      const teacherList =
        teachersResult.data || [];

      setTeachers(teacherList);

      /*
       * AUTRES STATISTIQUES
       */

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
          .select("id", {
            count: "exact",
            head: true,
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
        teachers: teacherList.length,
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
        "Erreur : " +
        (error.message ||
          "Impossible de charger les données.")
      );

    } finally {
      setLoading(false);
    }
  }

  async function refreshTeachers() {
    setLoadingTeachers(true);
    setMessage("");

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

      setStats((current) => ({
        ...current,
        teachers: list.length,
      }));

    } catch (error) {
      console.error(
        "Erreur actualisation professeurs:",
        error
      );

      setMessage(
        "Impossible de charger les professeurs : " +
        error.message
      );

    } finally {
      setLoadingTeachers(false);
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
            Depuis cet espace, vous pouvez
            administrer les professeurs,
            élèves, parents, écoles, classes
            et matières.
          </p>

        </div>

        {/* PROFESSEURS */}

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
                  : ""}.
              </p>

            </div>

            <button
              onClick={refreshTeachers}
              disabled={loadingTeachers}
            >
              {loadingTeachers
                ? "Actualisation..."
                : "↻ Actualiser"}
            </button>

          </div>

          {teachers.length === 0 ? (

            <div className="notice">

              <h3>
                Aucun professeur affiché
              </h3>

              <p>
                Aucun professeur n'est
                actuellement visible depuis
                l'application.
              </p>

            </div>

          ) : (

            <div>

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
                    📞{" "}
                    {teacher.phone ||
                      "Téléphone non renseigné"}
                  </span>

                  <span>
                    Rôle : {teacher.role}
                  </span>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* BOUTONS DE GESTION */}

        <div className="grid">

          <button
            onClick={() =>
              alert(
                "La gestion des professeurs sera ajoutée à cette section."
              )
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
