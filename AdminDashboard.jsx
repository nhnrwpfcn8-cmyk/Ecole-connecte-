import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/* =========================================================
   SUPABASE
   ========================================================= */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase n'est pas configuré. Vérifie VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel."
  );
}

const supabase = createClient(
  supabaseUrl || "",
  supabaseKey || ""
);

/* =========================================================
   STATS
   ========================================================= */

const EMPTY_STATS = {
  classes: 0,
  students: 0,
  subjects: 0,
  documents: 0,
  attendanceToday: 0,
};

/* =========================================================
   DASHBOARD
   ========================================================= */

export default function AdminDashboard() {
  const [profile, setProfile] = useState(null);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [stats, setStats] = useState(EMPTY_STATS);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activeSection, setActiveSection] = useState("dashboard");

  /* =========================================================
     UTILITAIRES
     ========================================================= */

  function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(parsedDate);
  }

  function formatTime(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsedDate);
  }

  function getTodayStart() {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return today.toISOString();
  }

  /* =========================================================
     PROFIL
     ========================================================= */

  async function loadProfile(userId) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, school_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(
        `Impossible de récupérer le profil : ${profileError.message}`
      );
    }

    setProfile(data);

    return data;
  }

  /* =========================================================
     CLASSES
     ========================================================= */

  async function loadClasses(schoolId) {
    let query = supabase
      .from("classes")
      .select("id, name, level, school_id, created_at")
      .order("name", { ascending: true });

    if (schoolId) {
      query = query.eq("school_id", schoolId);
    }

    const { data, error: classesError } = await query;

    if (classesError) {
      throw new Error(
        `Erreur lors du chargement des classes : ${classesError.message}`
      );
    }

    const result = data || [];

    setClasses(result);

    return result;
  }

  /* =========================================================
     MATIÈRES
     ========================================================= */

  async function loadSubjects() {
    const { data, error: subjectsError } = await supabase
      .from("subjects")
      .select("*")
      .order("name", { ascending: true });

    if (subjectsError) {
      console.warn(
        "Impossible de charger les matières :",
        subjectsError.message
      );

      setSubjects([]);

      return [];
    }

    const result = data || [];

    setSubjects(result);

    return result;
  }

  /* =========================================================
     ÉLÈVES
     ========================================================= */

  async function loadStudents(schoolId) {
    let query = supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (schoolId) {
      query = query.eq("school_id", schoolId);
    }

    const { data, error: studentsError } = await query;

    if (studentsError) {
      console.warn(
        "Impossible de charger les élèves :",
        studentsError.message
      );

      setStudents([]);

      return [];
    }

    const result = data || [];

    setStudents(result);

    return result;
  }

  /* =========================================================
     DOCUMENTS
     ========================================================= */

  async function loadDocuments(schoolId, loadedClasses) {
    const { data, error: documentsError } = await supabase
      .from("documents")
      .select(`
        id,
        teacher_id,
        class_id,
        subject_id,
        title,
        description,
        document_type,
        file_url,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (documentsError) {
      console.warn(
        "Impossible de charger les documents :",
        documentsError.message
      );

      setDocuments([]);

      return [];
    }

    let result = data || [];

    /*
      documents ne possède pas nécessairement school_id.
      On filtre donc par les classes de l'école.
    */

    if (schoolId && loadedClasses?.length > 0) {
      const classIds = new Set(
        loadedClasses
          .filter((item) => item.school_id === schoolId)
          .map((item) => item.id)
      );

      result = result.filter((document) =>
        classIds.has(document.class_id)
      );
    }

    setDocuments(result);

    return result;
  }

  /* =========================================================
     PRÉSENCES
     ========================================================= */

  async function loadAttendance() {
    const todayStart = getTodayStart();

    const { data, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .gte("created_at", todayStart)
      .order("created_at", { ascending: false });

    if (attendanceError) {
      console.warn(
        "Impossible de charger les présences :",
        attendanceError.message
      );

      setAttendance([]);

      return [];
    }

    const result = data || [];

    setAttendance(result);

    return result;
  }

  /* =========================================================
     CHARGEMENT COMPLET
     ========================================================= */

  async function loadDashboard(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error(
          "Aucun utilisateur connecté. Connecte-toi avant d'accéder au tableau de bord."
        );
      }

      /* Profil */

      const currentProfile = await loadProfile(user.id);

      const schoolId = currentProfile?.school_id || null;

      /* Classes */

      const loadedClasses = await loadClasses(schoolId);

      /* Matières */

      const loadedSubjects = await loadSubjects();

      /* Élèves */

      const loadedStudents = await loadStudents(schoolId);

      /* Documents */

      const loadedDocuments = await loadDocuments(
        schoolId,
        loadedClasses
      );

      /* Présences */

      const loadedAttendance = await loadAttendance();

      /*
        IMPORTANT :
        On utilise les variables loadedXXX et non les anciens
        états React afin d'avoir immédiatement les bonnes statistiques.
      */

      setStats({
        classes: loadedClasses.length,
        students: loadedStudents.length,
        subjects: loadedSubjects.length,
        documents: loadedDocuments.length,
        attendanceToday: loadedAttendance.length,
      });
    } catch (err) {
      console.error("AdminDashboard:", err);

      setError(
        err?.message ||
          "Une erreur est survenue lors du chargement du tableau de bord."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =========================================================
     INITIALISATION
     ========================================================= */

  useEffect(() => {
    loadDashboard(false);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        loadDashboard(false);
      }

      if (event === "SIGNED_OUT") {
        setProfile(null);
        setClasses([]);
        setSubjects([]);
        setStudents([]);
        setDocuments([]);
        setAttendance([]);
        setStats(EMPTY_STATS);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* =========================================================
     CLASSES PAR NIVEAU
     ========================================================= */

  const classesByLevel = useMemo(() => {
    return classes.reduce((acc, item) => {
      const level = item.level || "Autre";

      if (!acc[level]) {
        acc[level] = [];
      }

      acc[level].push(item);

      return acc;
    }, {});
  }, [classes]);

  /* =========================================================
     DOCUMENTS RÉCENTS
     ========================================================= */

  const recentDocuments = useMemo(() => {
    return documents.slice(0, 5);
  }, [documents]);

  /* =========================================================
     MENU
     ========================================================= */

  const menuItems = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: "📊",
    },
    {
      id: "classes",
      label: "Classes",
      icon: "🏫",
    },
    {
      id: "students",
      label: "Élèves",
      icon: "👨‍🎓",
    },
    {
      id: "subjects",
      label: "Matières",
      icon: "📚",
    },
    {
      id: "documents",
      label: "Documents",
      icon: "📄",
    },
    {
      id: "attendance",
      label: "Présences",
      icon: "✅",
    },
  ];

  /* =========================================================
     CHARGEMENT
     ========================================================= */

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner}></div>

        <h2>École Connectée</h2>

        <p>
          Chargement du tableau de bord...
        </p>
      </div>
    );
  }

  /* =========================================================
     AFFICHAGE
     ========================================================= */

  return (
    <div style={styles.page}>
      {/* SIDEBAR */}

      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logo}>
            EC
          </div>

          <div>
            <strong style={styles.logoTitle}>
              École
            </strong>

            <strong style={styles.logoGreen}>
              {" "}Connectée
            </strong>
          </div>
        </div>

        <div style={styles.schoolBox}>
          <div style={styles.schoolIcon}>
            🏫
          </div>

          <div>
            <div style={styles.schoolName}>
              École Connectée
            </div>

            <div style={styles.schoolRole}>
              Administration
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                setActiveSection(item.id)
              }
              style={{
                ...styles.navButton,
                ...(activeSection === item.id
                  ? styles.navButtonActive
                  : {}),
              }}
            >
              <span>{item.icon}</span>

              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <button
            style={styles.logoutButton}
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU */}

      <main style={styles.main}>
        {/* HEADER */}

        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {activeSection === "dashboard"
                ? "Tableau de bord"
                : menuItems.find(
                    (item) =>
                      item.id === activeSection
                  )?.label}
            </h1>

            <p style={styles.subtitle}>
              Bienvenue
              {profile?.full_name
                ? `, ${profile.full_name}`
                : ""}{" "}
              👋
            </p>
          </div>

          <div style={styles.headerRight}>
            <button
              style={styles.refreshButton}
              onClick={() =>
                loadDashboard(true)
              }
              disabled={refreshing}
            >
              {refreshing
                ? "Actualisation..."
                : "↻ Actualiser"}
            </button>

            <div style={styles.avatar}>
              {(profile?.full_name || "A")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        {/* ERREUR */}

        {error && (
          <div style={styles.errorBox}>
            <strong>
              ⚠️ Erreur
            </strong>

            <p>{error}</p>

            <button
              style={styles.retryButton}
              onClick={() =>
                loadDashboard(false)
              }
            >
              Réessayer
            </button>
          </div>
        )}

        {/* =================================================
            DASHBOARD
           ================================================= */}

        {activeSection === "dashboard" && (
          <>
            <section style={styles.statsGrid}>
              <StatCard
                icon="🏫"
                title="Classes"
                value={stats.classes}
                description="Classes enregistrées"
              />

              <StatCard
                icon="👨‍🎓"
                title="Élèves"
                value={stats.students}
                description="Élèves inscrits"
              />

              <StatCard
                icon="📚"
                title="Matières"
                value={stats.subjects}
                description="Matières disponibles"
              />

              <StatCard
                icon="📄"
                title="Documents"
                value={stats.documents}
                description="Documents publiés"
              />
            </section>

            <section
              style={styles.attendanceBanner}
            >
              <div
                style={styles.attendanceIcon}
              >
                ✅
              </div>

              <div>
                <h3
                  style={
                    styles.attendanceTitle
                  }
                >
                  Présences aujourd'hui
                </h3>

                <p
                  style={
                    styles.attendanceText
                  }
                >
                  {stats.attendanceToday}{" "}
                  enregistrement
                  {stats.attendanceToday !== 1
                    ? "s"
                    : ""}{" "}
                  de présence aujourd'hui.
                </p>
              </div>
            </section>

            {/* CLASSES */}

            <section style={styles.card}>
              <div
                style={styles.cardHeader}
              >
                <div>
                  <h2
                    style={styles.cardTitle}
                  >
                    Classes de l'établissement
                  </h2>

                  <p
                    style={
                      styles.cardSubtitle
                    }
                  >
                    {classes.length} classes
                    enregistrées
                  </p>
                </div>

                <button
                  style={styles.smallButton}
                  onClick={() =>
                    setActiveSection(
                      "classes"
                    )
                  }
                >
                  Voir toutes
                </button>
              </div>

              {classes.length === 0 ? (
                <EmptyState
                  text="Aucune classe trouvée."
                />
              ) : (
                <div
                  style={styles.classesGrid}
                >
                  {classes.map((item) => (
                    <div
                      key={item.id}
                      style={
                        styles.classCard
                      }
                    >
                      <div
                        style={
                          styles.classIcon
                        }
                      >
                        🏫
                      </div>

                      <div>
                        <strong
                          style={
                            styles.className
                          }
                        >
                          {item.name ||
                            "Classe sans nom"}
                        </strong>

                        <span
                          style={
                            styles.classLevel
                          }
                        >
                          {item.level ||
                            "Niveau non renseigné"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* DOCUMENTS RÉCENTS */}

            <section style={styles.card}>
              <div
                style={styles.cardHeader}
              >
                <div>
                  <h2
                    style={styles.cardTitle}
                  >
                    Documents récents
                  </h2>

                  <p
                    style={
                      styles.cardSubtitle
                    }
                  >
                    Derniers documents publiés
                  </p>
                </div>

                <button
                  style={styles.smallButton}
                  onClick={() =>
                    setActiveSection(
                      "documents"
                    )
                  }
                >
                  Voir tous
                </button>
              </div>

              {recentDocuments.length ===
              0 ? (
                <EmptyState
                  text="Aucun document publié."
                />
              ) : (
                <div
                  style={
                    styles.documentList
                  }
                >
                  {recentDocuments.map(
                    (document) => (
                      <div
                        key={document.id}
                        style={
                          styles.documentRow
                        }
                      >
                        <div
                          style={
                            styles.documentIcon
                          }
                        >
                          📄
                        </div>

                        <div
                          style={
                            styles.documentInfo
                          }
                        >
                          <strong>
                            {document.title ||
                              "Sans titre"}
                          </strong>

                          <span>
                            {document.document_type ||
                              "Document"}{" "}
                            •{" "}
                            {formatDate(
                              document.created_at
                            )}
                          </span>
                        </div>

                        {document.file_url && (
                          <a
                            href={
                              document.file_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={
                              styles.openLink
                            }
                          >
                            Ouvrir
                          </a>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* =================================================
            CLASSES
           ================================================= */}

        {activeSection === "classes" && (
          <section style={styles.card}>
            <div
              style={styles.cardHeader}
            >
              <div>
                <h2
                  style={styles.cardTitle}
                >
                  Gestion des classes
                </h2>

                <p
                  style={
                    styles.cardSubtitle
                  }
                >
                  Classes actuellement
                  enregistrées dans Supabase
                </p>
              </div>
            </div>

            {classes.length === 0 ? (
              <EmptyState
                text="Aucune classe trouvée."
              />
            ) : (
              Object.keys(
                classesByLevel
              ).map((level) => (
                <div
                  key={level}
                  style={
                    styles.levelSection
                  }
                >
                  <h3
                    style={
                      styles.levelTitle
                    }
                  >
                    {level}
                  </h3>

                  <div
                    style={
                      styles.classesGrid
                    }
                  >
                    {classesByLevel[
                      level
                    ].map((item) => (
                      <div
                        key={item.id}
                        style={
                          styles.classCard
                        }
                      >
                        <div
                          style={
                            styles.classIcon
                          }
                        >
                          🏫
                        </div>

                        <div>
                          <strong
                            style={
                              styles.className
                            }
                          >
                            {item.name}
                          </strong>

                          <span
                            style={
                              styles.classLevel
                            }
                          >
                            Niveau :{" "}
                            {item.level ||
                              "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* =================================================
            ÉLÈVES
           ================================================= */}

        {activeSection === "students" && (
          <section style={styles.card}>
            <div
              style={styles.cardHeader}
            >
              <div>
                <h2
                  style={styles.cardTitle}
                >
                  Élèves
                </h2>

                <p
                  style={
                    styles.cardSubtitle
                  }
                >
                  {students.length} élève
                  {students.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
            </div>

            {students.length === 0 ? (
              <EmptyState
                text="Aucun élève trouvé."
              />
            ) : (
              <div
                style={styles.tableWrapper}
              >
                <table
                  style={styles.table}
                >
                  <thead>
                    <tr>
                      <th style={styles.th}>
                        Élève
                      </th>

                      <th style={styles.th}>
                        Classe
                      </th>

                      <th style={styles.th}>
                        ID
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map(
                      (student) => {
                        const classId =
                          student.class_id ||
                          student.classe_id;

                        const studentClass =
                          classes.find(
                            (item) =>
                              item.id ===
                              classId
                          );

                        const studentName =
                          student.full_name ||
                          student.name ||
                          [
                            student.first_name,
                            student.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ") ||
                          "Élève";

                        return (
                          <tr
                            key={
                              student.id
                            }
                          >
                            <td
                              style={
                                styles.td
                              }
                            >
                              {studentName}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {studentClass?.name ||
                                "Non affecté"}
                            </td>

                            <td
                              style={
                                styles.tdSmall
                              }
                            >
                              {student.id}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* =================================================
            MATIÈRES
           ================================================= */}

        {activeSection === "subjects" && (
          <section style={styles.card}>
            <div
              style={styles.cardHeader}
            >
              <div>
                <h2
                  style={styles.cardTitle}
                >
                  Matières
                </h2>

                <p
                  style={
                    styles.cardSubtitle
                  }
                >
                  Matières disponibles dans
                  Supabase
                </p>
              </div>
            </div>

            {subjects.length === 0 ? (
              <EmptyState
                text="Aucune matière trouvée."
              />
            ) : (
              <div
                style={
                  styles.classesGrid
                }
              >
                {subjects.map(
                  (subject) => (
                    <div
                      key={subject.id}
                      style={
                        styles.classCard
                      }
                    >
                      <div
                        style={
                          styles.classIcon
                        }
                      >
                        📚
                      </div>

                      <div>
                        <strong
                          style={
                            styles.className
                          }
                        >
                          {subject.name ||
                            subject.nom ||
                            "Matière"}
                        </strong>

                        <span
                          style={
                            styles.classLevel
                          }
                        >
                          ID :{" "}
                          {subject.id}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {/* =================================================
            DOCUMENTS
           ================================================= */}

        {activeSection === "documents" && (
          <section style={styles.card}>
            <div
              style={styles.cardHeader}
            >
              <div>
                <h2
                  style={styles.cardTitle}
                >
                  Documents pédagogiques
                </h2>

                <p
                  style={
                    styles.cardSubtitle
                  }
                >
                  Documents publiés par les
                  enseignants
                </p>
              </div>
            </div>

            {documents.length === 0 ? (
              <EmptyState
                text="Aucun document trouvé."
              />
            ) : (
              <div
                style={
                  styles.documentList
                }
              >
                {documents.map(
                  (document) => {
                    const classItem =
                      classes.find(
                        (item) =>
                          item.id ===
                          document.class_id
                      );

                    const subjectItem =
                      subjects.find(
                        (item) =>
                          String(
                            item.id
                          ) ===
                          String(
                            document.subject_id
                          )
                      );

                    return (
                      <div
                        key={
                          document.id
                        }
                        style={
                          styles.documentRow
                        }
                      >
                        <div
                          style={
                            styles.documentIcon
                          }
                        >
                          📄
                        </div>

                        <div
                          style={
                            styles.documentInfo
                          }
                        >
                          <strong>
                            {document.title ||
                              "Sans titre"}
                          </strong>

                          <span>
                            Type :{" "}
                            {document.document_type ||
                              "—"}
                          </span>

                          <span>
                            Classe :{" "}
                            {classItem?.name ||
                              "—"}
                          </span>

                          <span>
                            Matière :{" "}
                            {subjectItem?.name ||
                              subjectItem?.nom ||
                              "—"}
                          </span>
                        </div>

                        <div
                          style={
                            styles.documentDate
                          }
                        >
                          {formatDate(
                            document.created_at
                          )}
                        </div>

                        {document.file_url && (
                          <a
                            href={
                              document.file_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={
                              styles.openLink
                            }
                          >
                            Ouvrir
                          </a>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        )}

        {/* =================================================
            PRÉSENCES
           ================================================= */}

        {activeSection === "attendance" && (
          <section style={styles.card}>
            <div
              style={styles.cardHeader}
            >
              <div>
                <h2
                  style={styles.cardTitle}
                >
                  Présences du jour
                </h2>

                <p
                  style={
                    styles.cardSubtitle
                  }
                >
                  {attendance.length}{" "}
                  enregistrement
                  {attendance.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
            </div>

            {attendance.length === 0 ? (
              <EmptyState
                text="Aucun enregistrement de présence aujourd'hui."
              />
            ) : (
              <div
                style={
                  styles.tableWrapper
                }
              >
                <table
                  style={styles.table}
                >
                  <thead>
                    <tr>
                      <th style={styles.th}>
                        Élève
                      </th>

                      <th style={styles.th}>
                        Statut
                      </th>

                      <th style={styles.th}>
                        Heure
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {attendance.map(
                      (item) => {
                        const studentId =
                          item.student_id ||
                          item.studentId;

                        const student =
                          students.find(
                            (
                              studentItem
                            ) =>
                              studentItem.id ===
                              studentId
                          );

                        const status =
                          item.status ||
                          item.type ||
                          item.event_type ||
                          "Présence";

                        const studentName =
                          student?.full_name ||
                          student?.name ||
                          [
                            student?.first_name,
                            student?.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ") ||
                          "Élève";

                        return (
                          <tr
                            key={item.id}
                          >
                            <td
                              style={
                                styles.td
                              }
                            >
                              {studentName}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <span
                                style={
                                  styles.statusBadge
                                }
                              >
                                {status}
                              </span>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {formatTime(
                                item.created_at
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* FOOTER */}

        <footer style={styles.footer}>
          École Connectée ©{" "}
          {new Date().getFullYear()} — Gestion
          scolaire intelligente
        </footer>
      </main>
    </div>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  icon,
  title,
  value,
  description,
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>
        {icon}
      </div>

      <div>
        <p style={styles.statTitle}>
          {title}
        </p>

        <strong style={styles.statValue}>
          {value}
        </strong>

        <p
          style={
            styles.statDescription
          }
        >
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyState({ text }) {
  return (
    <div style={styles.empty}>
      <div style={styles.emptyIcon}>
        📭
      </div>

      <p>{text}</p>
    </div>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  sidebar: {
    width: "250px",
    minHeight: "100vh",
    background: "#ffffff",
    borderRight: "1px solid #e6eaf0",
    padding: "22px 16px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "26px",
    padding: "4px",
  },

  logo: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#0b65c2",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "15px",
  },

  logoTitle: {
    color: "#1468c4",
  },

  logoGreen: {
    color: "#1ba36a",
  },

  schoolBox: {
    background: "#f1f6fc",
    borderRadius: "14px",
    padding: "13px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "24px",
  },

  schoolIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  schoolName: {
    fontWeight: "700",
    fontSize: "13px",
  },

  schoolRole: {
    color: "#738096",
    fontSize: "12px",
    marginTop: "3px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  navButton: {
    border: "none",
    background: "transparent",
    padding: "12px 13px",
    borderRadius: "10px",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    color: "#68758a",
    fontSize: "14px",
    fontWeight: "600",
  },

  navButtonActive: {
    background: "#eaf3ff",
    color: "#0969c8",
  },

  sidebarBottom: {
    marginTop: "auto",
  },

  logoutButton: {
    width: "100%",
    border: "1px solid #e5e9ef",
    background: "#ffffff",
    padding: "11px",
    borderRadius: "10px",
    cursor: "pointer",
    color: "#68758a",
    fontWeight: "600",
  },

  main: {
    flex: 1,
    padding: "28px",
    minWidth: 0,
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "26px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "800",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#7a8799",
    fontSize: "14px",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  refreshButton: {
    border: "1px solid #dce4ee",
    background: "#ffffff",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    color: "#415065",
    fontWeight: "600",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#0b65c2",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },

  errorBox: {
    background: "#fff2f2",
    border: "1px solid #ffcaca",
    color: "#9d2020",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "20px",
  },

  retryButton: {
    border: "none",
    background: "#b42318",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "8px 13px",
    cursor: "pointer",
    fontWeight: "600",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "16px",
    marginBottom: "18px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e8ecf2",
    borderRadius: "16px",
    padding: "19px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 2px 8px rgba(15, 35, 60, 0.03)",
  },

  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "13px",
    background: "#edf5ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  statTitle: {
    margin: 0,
    color: "#7a8799",
    fontSize: "13px",
  },

  statValue: {
    display: "block",
    fontSize: "27px",
    marginTop: "2px",
  },

  statDescription: {
    margin: "2px 0 0",
    color: "#9aa5b4",
    fontSize: "11px",
  },

  attendanceBanner: {
    background: "#eaf8f1",
    border: "1px solid #cceedd",
    borderRadius: "16px",
    padding: "17px 20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "18px",
  },

  attendanceIcon: {
    width: "44px",
    height: "44px",
    background: "#ffffff",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  attendanceTitle: {
    margin: 0,
    fontSize: "16px",
  },

  attendanceText: {
    margin: "4px 0 0",
    color: "#62806f",
    fontSize: "13px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e8ecf2",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "18px",
    boxShadow:
      "0 2px 8px rgba(15, 35, 60, 0.03)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "18px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "18px",
  },

  cardSubtitle: {
    margin: "4px 0 0",
    color: "#8894a5",
    fontSize: "13px",
  },

  smallButton: {
    border: "none",
    background: "#edf5ff",
    color: "#0969c8",
    borderRadius: "9px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: "700",
  },

  classesGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },

  classCard: {
    border: "1px solid #e9edf2",
    borderRadius: "13px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#fbfcfe",
  },

  classIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    background: "#edf5ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },

  className: {
    display: "block",
    fontSize: "14px",
  },

  classLevel: {
    display: "block",
    color: "#8490a1",
    fontSize: "12px",
    marginTop: "4px",
    wordBreak: "break-all",
  },

  documentList: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  documentRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    border: "1px solid #edf0f4",
    borderRadius: "11px",
  },

  documentIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#f1f5ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  documentInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  documentDate: {
    color: "#8894a5",
    fontSize: "12px",
  },

  openLink: {
    textDecoration: "none",
    background: "#edf5ff",
    color: "#0969c8",
    borderRadius: "8px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: "700",
  },

  levelSection: {
    marginBottom: "22px",
  },

  levelTitle: {
    fontSize: "15px",
    margin: "0 0 10px",
    color: "#536176",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "600px",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f7f9fc",
    color: "#68758a",
    fontSize: "12px",
    borderBottom:
      "1px solid #e8ecf2",
  },

  td: {
    padding: "13px 12px",
    borderBottom:
      "1px solid #edf0f4",
    fontSize: "13px",
  },

  tdSmall: {
    padding: "13px 12px",
    borderBottom:
      "1px solid #edf0f4",
    fontSize: "11px",
    color: "#8994a5",
    wordBreak: "break-all",
  },

  statusBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#eaf8f1",
    color: "#218653",
    fontSize: "11px",
    fontWeight: "700",
  },

  empty: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#8a95a5",
  },

  emptyIcon: {
    fontSize: "30px",
    marginBottom: "7px",
  },

  footer: {
    textAlign: "center",
    color: "#9aa5b4",
    fontSize: "12px",
    padding: "20px 0 5px",
  },

  loadingPage: {
    minHeight: "100vh",
    background: "#f5f7fb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#172033",
  },

  spinner: {
    width: "38px",
    height: "38px",
    border: "4px solid #dce8f5",
    borderTop:
      "4px solid #0b65c2",
    borderRadius: "50%",
    animation:
      "spin 1s linear infinite",
    marginBottom: "15px",
  },
};
