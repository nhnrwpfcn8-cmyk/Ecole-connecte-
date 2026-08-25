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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const teachersResponse = await supabase
        .from("profiles")
        .select("id, full_name, phone, role")
        .eq("role", "teacher")
        .order("full_name");

      if (teachersResponse.error) {
        throw teachersResponse.error;
      }

      const teacherList = teachersResponse.data || [];

      setTeachers(teacherList);

      const studentsResponse = await supabase
        .from("students")
        .select("id", {
          count: "exact",
          head: true,
        });

      const parentsResponse = await supabase
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("role", "parent");

      const schoolsResponse = await supabase
        .from("schools")
        .select("id", {
          count: "exact",
          head: true,
        });

      const classesResponse = await supabase
        .from("classes")
        .select("id", {
          count: "exact",
          head: true,
        });

      const subjectsResponse = await supabase
        .from("subjects")
        .select("id", {
          count: "exact",
          head: true,
        });

      if (studentsResponse.error) {
        throw studentsResponse.error;
      }

      if (parentsResponse.error) {
        throw parentsResponse.error;
      }

      if (schoolsResponse.error) {
        throw schoolsResponse.error;
      }

      if (classesResponse.error) {
        throw classesResponse.error;
      }

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
        "Erreur administration :",
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
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role")
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
        "Erreur professeurs :",
        error
      );

      setMessage(
        "Impossible de charger les professeurs : " +
          error.message
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

        {message && (
          <p className="message">
            {message}
          </p>
        )}

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
              onClick={refreshTeachers}
            >
              ↻ Actualiser
            </button>

          </div>

          {teachers.length === 0 ? (

            <p>
              Aucun professeur affiché.
            </p>

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
                    Téléphone :{" "}
                    {teacher.phone ||
                      "Non renseigné"}
                  </span>

                  <span>
                    Rôle : {teacher.role}
                  </span>

                </div>

              ))}

            </div>

          )}

        </div>

        <div className="grid">

          <button
            onClick={() =>
              alert("Gestion des professeurs")
            }
          >
            👨‍🏫
            <br />
            Gérer les professeurs
          </button>

          <button
            onClick={() =>
              alert("Gestion des élèves")
            }
          >
            👨‍🎓
            <br />
            Gérer les élèves
          </button>

          <button
            onClick={() =>
              alert("Gestion des parents")
            }
          >
            👨‍👩‍👧
            <br />
            Gérer les parents
          </button>

          <button
            onClick={() =>
              alert("Gestion des écoles")
            }
          >
            🏫
            <br />
            Gérer les écoles
          </button>

          <button
            onClick={() =>
              alert("Gestion des classes")
            }
          >
            📚
            <br />
            Gérer les classes
          </button>

          <button
            onClick={() =>
              alert("Gestion des matières")
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
