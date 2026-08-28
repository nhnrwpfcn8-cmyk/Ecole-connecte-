import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function AdminDashboard({ session, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [documentError, setDocumentError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [stats, setStats] = useState({
    documents: 0,
    teachers: 0,
    classes: 0,
    subjects: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoadingDocuments(true);
    setDocumentError("");

    try {
      /*
       * DOCUMENTS
       *
       * Structure confirmée dans Supabase :
       * documents.teacher_id -> profiles.id
       * documents.class_id   -> classes.id
       * documents.subject_id -> subjects.id
       */
      const { data: documentsData, error: documentsError } =
        await supabase
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
            created_at,
            teacher:profiles!documents_teacher_id_fkey (
              id,
              full_name,
              role
            ),
            class:classes!documents_class_id_fkey (
              id,
              name,
              level
            ),
            subject:subjects!documents_subject_id_fkey (
              id,
              name
            )
          `)
          .order("created_at", { ascending: false });

      if (documentsError) {
        console.error("Erreur documents :", documentsError);
        throw documentsError;
      }

      setDocuments(documentsData || []);

      /*
       * STATISTIQUES
       */
      const [
        teachersResult,
        classesResult,
        subjectsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "teacher"),

        supabase
          .from("classes")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("subjects")
          .select("id", { count: "exact", head: true }),
      ]);

      setStats({
        documents: documentsData?.length || 0,
        teachers: teachersResult.count || 0,
        classes: classesResult.count || 0,
        subjects: subjectsResult.count || 0,
      });
    } catch (error) {
      console.error(error);

      setDocumentError(
        error?.message ||
          "Impossible de charger les documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  }

  /*
   * FILTRAGE DES DOCUMENTS
   */
  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return documents.filter((document) => {
      const teacherName =
        document.teacher?.full_name || "";

      const className =
        document.class?.name || "";

      const subjectName =
        document.subject?.name || "";

      const title =
        document.title || "";

      const description =
        document.description || "";

      const matchesSearch =
        !normalizedSearch ||
        title.toLowerCase().includes(normalizedSearch) ||
        description.toLowerCase().includes(normalizedSearch) ||
        teacherName.toLowerCase().includes(normalizedSearch) ||
        className.toLowerCase().includes(normalizedSearch) ||
        subjectName.toLowerCase().includes(normalizedSearch);

      const matchesType =
        typeFilter === "all" ||
        document.document_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [documents, search, typeFilter]);

  /*
   * FORMAT DATE
   */
  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /*
   * NOM DU TYPE DE DOCUMENT
   */
  function formatDocumentType(type) {
    const types = {
      lecon: "Leçon",
      exercice: "Exercice",
      interrogation: "Interrogation",
      devoir: "Devoir",
      cours: "Cours",
      autre: "Autre",
    };

    return types[type] || type || "Document";
  }

  /*
   * COULEUR / STYLE DU TYPE
   */
  function getTypeClass(type) {
    switch (type) {
      case "lecon":
        return "document-type lesson";

      case "exercice":
        return "document-type exercise";

      case "interrogation":
        return "document-type test";

      case "devoir":
        return "document-type homework";

      case "cours":
        return "document-type course";

      default:
        return "document-type other";
    }
  }

  /*
   * SUPPRESSION D'UN DOCUMENT
   */
  async function deleteDocument(documentId) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce document ?"
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;

      setDocuments((current) =>
        current.filter(
          (document) => document.id !== documentId
        )
      );

      setStats((current) => ({
        ...current,
        documents: Math.max(0, current.documents - 1),
      }));
    } catch (error) {
      console.error(error);

      alert(
        error?.message ||
          "Impossible de supprimer le document."
      );
    }
  }

  /*
   * ACTUALISER
   */
  async function refreshDocuments() {
    await loadData();
  }

  return (
    <div className="admin-dashboard">
      <style>{`
        .admin-dashboard {
          min-height: 100vh;
          background: #f5f7fb;
          color: #172033;
          font-family: Inter, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .admin-header {
          background: #ffffff;
          border-bottom: 1px solid #e6eaf0;
          padding: 18px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .admin-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1769e0, #16a36a);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 18px;
        }

        .brand-title {
          font-size: 19px;
          font-weight: 800;
        }

        .brand-subtitle {
          color: #7a8497;
          font-size: 12px;
          margin-top: 2px;
        }

        .admin-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .refresh-button,
        .logout-button {
          border: 0;
          border-radius: 9px;
          padding: 10px 15px;
          cursor: pointer;
          font-weight: 700;
        }

        .refresh-button {
          background: #eef4ff;
          color: #1769e0;
        }

        .logout-button {
          background: #fff0f0;
          color: #d93636;
        }

        .admin-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px;
        }

        .welcome {
          margin-bottom: 24px;
        }

        .welcome h1 {
          margin: 0;
          font-size: 28px;
        }

        .welcome p {
          margin: 7px 0 0;
          color: #768096;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e8ebf1;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 3px 12px rgba(25, 40, 70, 0.04);
        }

        .stat-label {
          color: #778197;
          font-size: 13px;
          font-weight: 600;
        }

        .stat-value {
          font-size: 30px;
          font-weight: 800;
          margin-top: 8px;
        }

        .documents-section {
          background: white;
          border: 1px solid #e8ebf1;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 3px 12px rgba(25, 40, 70, 0.04);
        }

        .section-header {
          padding: 20px 22px;
          border-bottom: 1px solid #edf0f4;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .section-title {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
        }

        .section-subtitle {
          margin: 4px 0 0;
          color: #7b8497;
          font-size: 13px;
        }

        .filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .search-input,
        .type-select {
          border: 1px solid #dce1e9;
          background: white;
          border-radius: 9px;
          padding: 10px 12px;
          outline: none;
          min-width: 190px;
        }

        .documents-list {
          width: 100%;
          overflow-x: auto;
        }

        .documents-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 950px;
        }

        .documents-table th {
          text-align: left;
          padding: 14px 18px;
          background: #fafbfd;
          color: #6f788b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .04em;
          border-bottom: 1px solid #edf0f4;
        }

        .documents-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #f0f2f5;
          vertical-align: middle;
          font-size: 14px;
        }

        .document-title {
          font-weight: 750;
          color: #1a2335;
        }

        .document-description {
          color: #7c8598;
          font-size: 12px;
          margin-top: 4px;
          max-width: 260px;
        }

        .teacher-name {
          font-weight: 650;
        }

        .class-name,
        .subject-name {
          font-weight: 600;
        }

        .document-type {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 750;
        }

        .document-type.lesson {
          background: #eaf3ff;
          color: #1769e0;
        }

        .document-type.exercise {
          background: #e9f9f0;
          color: #12804d;
        }

        .document-type.test {
          background: #fff3df;
          color: #a76100;
        }

        .document-type.homework {
          background: #f3eaff;
          color: #7041b5;
        }

        .document-type.course {
          background: #e9f7f7;
          color: #187777;
        }

        .document-type.other {
          background: #eef0f3;
          color: #626b7c;
        }

        .file-button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          text-decoration: none;
          background: #1769e0;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .delete-button {
          border: 0;
          background: #fff0f0;
          color: #d93636;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          margin-left: 7px;
        }

        .empty-state {
          padding: 55px 20px;
          text-align: center;
          color: #7b8497;
        }

        .error-state {
          margin: 20px;
          padding: 15px;
          border-radius: 10px;
          background: #fff1f1;
          color: #c62f2f;
          font-size: 14px;
        }

        .loading {
          padding: 45px;
          text-align: center;
          color: #758096;
        }

        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-content {
            padding: 20px 14px;
          }

          .admin-header {
            padding: 15px;
          }
        }

        @media (max-width: 550px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .stat-card {
            padding: 15px;
          }

          .stat-value {
            font-size: 24px;
          }

          .welcome h1 {
            font-size: 23px;
          }

          .admin-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="admin-header">
        <div className="admin-brand">
          <div className="brand-logo">EC</div>

          <div>
            <div className="brand-title">
              École Connectée
            </div>

            <div className="brand-subtitle">
              Administration
            </div>
          </div>
        </div>

        <div className="admin-actions">
          <button
            className="refresh-button"
            onClick={refreshDocuments}
            disabled={loadingDocuments}
          >
            ↻ Actualiser
          </button>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="admin-content">

        {/* BIENVENUE */}
        <div className="welcome">
          <h1>Tableau de bord</h1>

          <p>
            Gestion des enseignants, classes, matières et
            documents publiés.
          </p>
        </div>

        {/* STATISTIQUES */}
        <div className="stats-grid">

          <div className="stat-card">
            <div className="stat-label">
              Documents publiés
            </div>

            <div className="stat-value">
              {stats.documents}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Enseignants
            </div>

            <div className="stat-value">
              {stats.teachers}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Classes
            </div>

            <div className="stat-value">
              {stats.classes}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Matières
            </div>

            <div className="stat-value">
              {stats.subjects}
            </div>
          </div>

        </div>

        {/* DOCUMENTS */}
        <section className="documents-section">

          <div className="section-header">

            <div>
              <h2 className="section-title">
                Documents des enseignants
              </h2>

              <p className="section-subtitle">
                Tous les documents publiés depuis
                l'espace enseignant.
              </p>
            </div>

            <div className="filters">

              <input
                className="search-input"
                type="search"
                placeholder="Rechercher..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <select
                className="type-select"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value)
                }
              >
                <option value="all">
                  Tous les types
                </option>

                <option value="lecon">
                  Leçons
                </option>

                <option value="exercice">
                  Exercices
                </option>

                <option value="interrogation">
                  Interrogations
                </option>

                <option value="devoir">
                  Devoirs
                </option>

                <option value="cours">
                  Cours
                </option>

                <option value="autre">
                  Autres
                </option>
              </select>

            </div>
          </div>

          {documentError && (
            <div className="error-state">
              {documentError}
            </div>
          )}

          {loadingDocuments ? (
            <div className="loading">
              Chargement des documents...
            </div>
          ) : filteredDocuments.length === 0 ? (

            <div className="empty-state">
              <h3>
                Aucun document trouvé
              </h3>

              <p>
                Les documents publiés par les enseignants
                apparaîtront ici.
              </p>
            </div>

          ) : (

            <div className="documents-list">

              <table className="documents-table">

                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Enseignant</th>
                    <th>Classe</th>
                    <th>Matière</th>
                    <th>Date</th>
                    <th>Fichier</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredDocuments.map((document) => (

                    <tr key={document.id}>

                      <td>
                        <div className="document-title">
                          {document.title}
                        </div>

                        {document.description && (
                          <div className="document-description">
                            {document.description}
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          className={getTypeClass(
                            document.document_type
                          )}
                        >
                          {formatDocumentType(
                            document.document_type
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="teacher-name">
                          {document.teacher?.full_name ||
                            "Enseignant"}
                        </div>
                      </td>

                      <td>
                        <div className="class-name">
                          {document.class?.name || "—"}
                        </div>

                        {document.class?.level && (
                          <small>
                            {document.class.level}
                          </small>
                        )}
                      </td>

                      <td>
                        <div className="subject-name">
                          {document.subject?.name || "—"}
                        </div>
                      </td>

                      <td>
                        {formatDate(
                          document.created_at
                        )}
                      </td>

                      <td>
                        {document.file_url ? (
                          <a
                            className="file-button"
                            href={document.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            📄 Ouvrir
                          </a>
                        ) : (
                          <span>
                            Aucun fichier
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          className="delete-button"
                          onClick={() =>
                            deleteDocument(document.id)
                          }
                        >
                          Supprimer
                        </button>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>
    </div>
  );
}
