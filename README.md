# 🏦 AKT-Bank: Enterprise Full-Stack Core Banking Platform

[![Java](https://img.shields.io/badge/Java-21-orange.svg?style=for-the-badge&logo=openjdk)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.2-brightgreen.svg?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Architecture](https://img.shields.io/badge/Architecture-Double--Entry%20Bookkeeping-blueviolet.svg?style=for-the-badge)](https://en.wikipedia.org/wiki/Double-entry_bookkeeping)

---

## 📌 Project Overview

**`AKT-Bank`** is an enterprise-grade full-stack core banking solution engineered to deliver high-integrity financial operations, double-entry bookkeeping, robust concurrency control, and an intuitive modern frontend interface.

The project is structured as a monorepo consisting of:
* **`backend/`**: High-throughput Core Banking Ledger engine built with Spring Boot 4, Java 21 LTS, and PostgreSQL. Enforces Double-Entry Bookkeeping ($\sum \text{DEBIT} = \sum \text{CREDIT}$), Pessimistic Locking with deterministic ordering (preventing deadlocks), client-side Idempotency Keys, and full observability (Prometheus & Grafana).
* **`frontend/`**: Interactive banking web portal and administration dashboard for account management, ledger tracking, fund transfers, and real-time transaction history *(under active development)*.

---

## 📁 Repository Structure

```text
AKT-Bank/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI for build & test
├── backend/                     # Core Banking Ledger Engine (Java 21 / Spring Boot)
│   ├── docker/                  # Prometheus and Grafana provisioning
│   ├── docs/                    # Architectural diagrams & screenshots
│   ├── src/                     # Application source code & integration tests
│   ├── docker-compose.yml       # Containerized environment
│   ├── Dockerfile               # Multi-stage container build
│   ├── pom.xml                  # Maven dependencies & build lifecycle
│   ├── DATABASE_SCHEMA.md       # Relational database schema & ER diagrams
│   └── README.md                # Detailed backend engine documentation
├── frontend/                    # Modern Web UI / Dashboard
│   └── .gitkeep                 # Initialized placeholder
├── .gitignore
├── .gitattributes
└── README.md                    # Project root documentation
```

---

## 🚀 Getting Started

### Backend Engine
For detailed backend documentation, database schema, and API endpoints:
👉 See [Backend Documentation](./backend/README.md) and [Database Schema](./backend/DATABASE_SCHEMA.md).

```bash
cd backend
./mvnw clean verify
docker compose up -d
```

---

## 🔒 Security & Concurrency Guarantees
* **Double-Entry Bookkeeping:** Append-only ledger; no arbitrary balance updates.
* **Deadlock Elimination:** Natural lexicographical locking order applied on account IDs.
* **Idempotency Barrier:** Guarantees safe network retries without duplicate charges.
* **Observability:** Pre-configured Prometheus metrics and Grafana dashboards for transaction latency and throughput.
