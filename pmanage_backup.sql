--
-- PostgreSQL database dump
--

\restrict ujBtqgpmsNhR1zBBBGyojXD7sslF4wQUeWKGmevBUZKzsv7b9FbPX53ivD8Dedr

-- Dumped from database version 14.19
-- Dumped by pg_dump version 14.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_notifications (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    is_read boolean NOT NULL,
    message text,
    related_project_id uuid,
    title character varying(255),
    type character varying(255),
    recipient_id bigint NOT NULL,
    sender_email character varying(255),
    sender_name character varying(255),
    message_id uuid,
    is_direct boolean
);


ALTER TABLE public.app_notifications OWNER TO postgres;

--
-- Name: chat_file_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_file_attachments (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    file_name character varying(255) NOT NULL,
    file_size bigint NOT NULL,
    file_type character varying(255) NOT NULL,
    storage_path character varying(255) NOT NULL,
    chat_message_id uuid NOT NULL
);


ALTER TABLE public.chat_file_attachments OWNER TO postgres;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    content text,
    message_type character varying(255) NOT NULL,
    project_id uuid NOT NULL,
    user_id bigint NOT NULL,
    recipient_id bigint,
    CONSTRAINT chat_messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['TEXT'::character varying, 'FILE'::character varying, 'SYSTEM'::character varying])::text[])))
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_read_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_read_receipts (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    read_at timestamp(6) without time zone NOT NULL,
    last_read_message_id uuid NOT NULL,
    project_id uuid NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.chat_read_receipts OWNER TO postgres;

--
-- Name: chat_read_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_read_status (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    last_read_at timestamp(6) without time zone NOT NULL,
    peer_id bigint,
    project_id uuid NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.chat_read_status OWNER TO postgres;

--
-- Name: issue_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.issue_comments (
    id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    author_id bigint NOT NULL,
    issue_id uuid NOT NULL,
    updated_at timestamp(6) without time zone
);


ALTER TABLE public.issue_comments OWNER TO postgres;

--
-- Name: issue_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.issue_history (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    field character varying(255) NOT NULL,
    new_value text,
    old_value text,
    issue_id uuid NOT NULL,
    user_id bigint
);


ALTER TABLE public.issue_history OWNER TO postgres;

--
-- Name: issue_labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.issue_labels (
    issue_id uuid NOT NULL,
    label character varying(255)
);


ALTER TABLE public.issue_labels OWNER TO postgres;

--
-- Name: issues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.issues (
    id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    end_date date,
    issue_key character varying(255) NOT NULL,
    priority character varying(255) NOT NULL,
    start_date date,
    status character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    assignee_id bigint,
    epic_id uuid,
    project_id uuid NOT NULL,
    parent_id uuid,
    "position" double precision,
    ai_assignment_reason text,
    CONSTRAINT issues_priority_check CHECK (((priority)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying])::text[]))),
    CONSTRAINT issues_status_check CHECK (((status)::text = ANY ((ARRAY['TODO'::character varying, 'IN_PROGRESS'::character varying, 'IN_REVIEW'::character varying, 'DONE'::character varying])::text[]))),
    CONSTRAINT issues_type_check CHECK (((type)::text = ANY ((ARRAY['EPIC'::character varying, 'TASK'::character varying, 'BUG'::character varying, 'STORY'::character varying])::text[])))
);


ALTER TABLE public.issues OWNER TO postgres;

--
-- Name: labels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.labels (
    id bigint NOT NULL,
    color character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    project_id uuid NOT NULL
);


ALTER TABLE public.labels OWNER TO postgres;

--
-- Name: labels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.labels ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.labels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: project_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_members (
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    user_id bigint NOT NULL,
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    role character varying(255) NOT NULL,
    last_read_chat_at timestamp(6) without time zone,
    CONSTRAINT project_members_role_check CHECK (((role)::text = ANY ((ARRAY['PROJECT_MANAGER'::character varying, 'PROJECT_MEMBER'::character varying, 'PROJECT_ADMIN'::character varying])::text[])))
);


ALTER TABLE public.project_members OWNER TO postgres;

--
-- Name: project_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_reports (
    id uuid NOT NULL,
    accomplishments text,
    blockers text,
    completed_issues bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    executive_summary text,
    issues_by_assignee_json text,
    issues_by_priority_json text,
    issues_by_status_json text,
    issues_by_type_json text,
    next_steps text,
    project_key character varying(255) NOT NULL,
    project_name character varying(255) NOT NULL,
    team_dynamics text,
    total_issues bigint NOT NULL,
    total_messages bigint NOT NULL,
    generated_by_id bigint NOT NULL,
    project_id uuid NOT NULL,
    risk_assessment text,
    sprint_health text,
    velocity_analysis text,
    overdue_issues bigint DEFAULT 0,
    unassigned_issues bigint DEFAULT 0,
    issue_snapshots_json text,
    message_snapshots_json text
);


ALTER TABLE public.project_reports OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    project_key character varying(4) NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    id uuid NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(500),
    creator_email character varying(255) NOT NULL,
    version bigint,
    next_issue_number integer DEFAULT 1
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    password character varying(255) NOT NULL,
    last_seen_at timestamp(6) without time zone,
    skills text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: 16933; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('16933');


ALTER LARGE OBJECT 16933 OWNER TO postgres;

--
-- Name: 16934; Type: BLOB; Schema: -; Owner: postgres
--

SELECT pg_catalog.lo_create('16934');


ALTER LARGE OBJECT 16934 OWNER TO postgres;

--
-- Data for Name: app_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.app_notifications (id, created_at, updated_at, is_read, message, related_project_id, title, type, recipient_id, sender_email, sender_name, message_id, is_direct) FROM stdin;
27709cf6-dc35-4446-8571-2bc2b70d7ba8	2026-04-20 13:39:58.490871	2026-04-20 13:44:39.333683	t	Ahmet mentioned you: @[Erdal Akyuz](1) Mention deneme	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	\N	\N	\N	\N
490d74d1-ee24-4a6e-94ff-49ad3e90a3e7	2026-04-20 14:00:47.313939	2026-04-20 14:09:08.336626	t	Ahmet mentioned you: @[Erdal Akyuz](1) @[Ahmet Mehmet](3) #[ADPY-7](...	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	\N	\N	\N	\N
02ddc65b-9244-4633-a271-93e8358bff2d	2026-04-20 14:11:03.614684	2026-04-20 14:11:03.614684	f	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	2	ahmet@gmail.com	Ahmet Mehmet	\N	\N
ee87a498-d231-4ff1-b5e6-6a2175e29194	2026-04-20 14:11:03.597807	2026-04-20 14:11:18.516588	t	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	ahmet@gmail.com	Ahmet Mehmet	\N	\N
c170745f-f7d0-4d52-bfb6-78290a4cb52c	2026-04-20 13:54:06.112722	2026-04-20 14:11:24.051036	t	Ahmet mentioned you: @[Erdal Akyuz](1) @[Ahmet Mehmet](3) Deneme	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	\N	\N	\N	\N
19c4968f-0e1a-4af5-abc6-f49e9136265d	2026-04-20 14:11:31.619944	2026-04-20 14:11:31.619944	f	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) deneme	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	2	ahmet@gmail.com	Ahmet Mehmet	\N	\N
c7a20702-325c-4ba5-b8c5-c48dd51dfb98	2026-04-20 14:11:31.621074	2026-04-20 14:11:56.301071	t	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) deneme	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	ahmet@gmail.com	Ahmet Mehmet	\N	\N
97f94404-0f98-421f-bd81-34c2eec7aa60	2026-04-20 14:15:39.541861	2026-04-20 14:15:39.541861	f	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	2	ahmet@gmail.com	Ahmet Mehmet	9474a3dd-7948-4202-a366-dbce547487e5	\N
e52efee6-c462-4435-8eff-960ae939ad77	2026-04-20 14:15:39.527879	2026-04-20 14:15:46.75594	t	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	ahmet@gmail.com	Ahmet Mehmet	9474a3dd-7948-4202-a366-dbce547487e5	\N
7f6543d3-7e71-48d0-a429-9a2a7a33b538	2026-04-20 14:16:00.821824	2026-04-20 14:16:00.821824	f	Erdal Akyuz mentioned you: @[Erdal Akyuz](1) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	2	erdalakyuz33@gmail.com	Erdal Akyuz	fd62180a-75ca-4412-8485-82299e4d1db1	\N
94a4c8ed-bbec-497f-a46c-1910eb20f59a	2026-04-20 14:16:07.032633	2026-04-20 14:16:16.127469	t	Erdal Akyuz mentioned you: @[Ahmet Mehmet](3) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	3	erdalakyuz33@gmail.com	Erdal Akyuz	b91fb5ae-e69c-48b1-a9b3-9f5ec979987f	\N
c5ea6501-6b87-49aa-bebf-326d04c5948b	2026-04-20 14:16:27.159481	2026-04-20 14:26:28.586364	t	Erdal Akyuz mentioned you: @[Ahmet Mehmet](3) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	3	erdalakyuz33@gmail.com	Erdal Akyuz	fb5c4849-a969-4bf1-8afa-5a2f9f397aea	\N
950150ea-378d-486b-aa93-9e4d0af9ddc2	2026-04-20 14:26:51.465893	2026-04-20 14:27:00.127413	t	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	ahmet@gmail.com	Ahmet Mehmet	06d27973-fca5-4601-a2d2-6bae01a568df	f
6b61b464-c5c7-4aa0-953d-4bcfed7720cc	2026-04-20 14:30:15.078438	2026-04-20 14:30:22.27722	t	Erdal Akyuz mentioned you: @[Ahmet Mehmet](3) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	3	erdalakyuz33@gmail.com	Erdal Akyuz	dfeeff6f-f749-430a-8892-d6ba67caa42c	f
bc47dc16-041e-4fe3-9c7a-d7a50430c4d3	2026-04-20 14:30:26.886604	2026-04-20 14:30:32.030212	t	Erdal Akyuz mentioned you: @[Ahmet Mehmet](3) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	3	erdalakyuz33@gmail.com	Erdal Akyuz	366e0f85-5301-4c1f-92e4-24cff2e78d37	f
0dccfd7e-819f-4338-8f44-5638610bea12	2026-04-20 14:38:57.608785	2026-04-20 14:39:06.195168	t	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	ahmet@gmail.com	Ahmet Mehmet	d9fe8321-1da9-4879-90bc-7f672be72c7c	f
81acb2e2-b896-40fc-bd77-6a4bbc1c10df	2026-04-20 14:48:13.959632	2026-04-20 14:48:23.286337	t	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	ahmet@gmail.com	Ahmet Mehmet	aee18195-f037-44e6-ae10-44ae6d504d82	f
a6d0a621-e252-4986-9bf4-69f4746eb562	2026-04-20 15:07:49.595372	2026-04-20 15:08:05.43816	t	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) Deneme	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	ahmet@gmail.com	Ahmet Mehmet	5503eca6-1f15-40b8-a746-f1025338d709	f
ffa90ae3-b899-4183-8f56-f46a3d35391a	2026-04-20 15:21:33.621096	2026-04-20 19:38:21.347871	t	Ahmet Mehmet mentioned you: @[Erdal Akyuz](1) 	8a2725d1-162a-4fb9-ba46-6d49008acb28	Mentioned in Chat	MENTION	1	ahmet@gmail.com	Ahmet Mehmet	7128c7a4-5ea1-4776-a8a4-c18e53c45c56	t
\.


--
-- Data for Name: chat_file_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_file_attachments (id, created_at, updated_at, file_name, file_size, file_type, storage_path, chat_message_id) FROM stdin;
c8fb352e-f13f-41d8-84bf-7f06c220fb59	2026-04-20 13:42:40.414158	2026-04-20 13:42:40.414158	pexels-therato-1933239.jpg	1197216	image/jpeg	C:\\Users\\userMe\\Documents\\AntigravityProjects\\ai-project-management\\pmanage\\uploads\\chat\\8a2725d1-162a-4fb9-ba46-6d49008acb28\\f3b3cc42-6366-4cf4-a55a-77bfe5a0ec2b.jpg	e71f26f8-f05a-4978-92d8-ffa49588c9de
39147cd5-138e-43ef-905d-2b4186fbe092	2026-04-20 13:42:45.439904	2026-04-20 13:42:45.439904	pexels-visit-greenland-108649-360912.jpg	1055582	image/jpeg	C:\\Users\\userMe\\Documents\\AntigravityProjects\\ai-project-management\\pmanage\\uploads\\chat\\8a2725d1-162a-4fb9-ba46-6d49008acb28\\a2076e47-eca3-4f50-a737-36048f0550fb.jpg	19724cba-f074-4cfa-8cbc-931d402ebdfa
b749d095-920c-4044-9bcb-4ff642d4bf12	2026-04-20 13:43:09.253651	2026-04-20 13:43:09.253651	Proje_Oneri_Erdal_Akyuz.docx	74691	application/vnd.openxmlformats-officedocument.wordprocessingml.document	C:\\Users\\userMe\\Documents\\AntigravityProjects\\ai-project-management\\pmanage\\uploads\\chat\\8a2725d1-162a-4fb9-ba46-6d49008acb28\\a14aabd6-3985-47ee-8bf2-52d56940494c.docx	dd81a827-c5a0-45c0-8d37-28f2cd0151df
e2cc9b8b-88bc-4249-b63f-3edc2e77437f	2026-04-20 14:13:00.870728	2026-04-20 14:13:00.870728	4.hafta_rapor_erdal_akyuz.docx	17606	application/vnd.openxmlformats-officedocument.wordprocessingml.document	C:\\Users\\userMe\\Documents\\AntigravityProjects\\ai-project-management\\pmanage\\uploads\\chat\\8a2725d1-162a-4fb9-ba46-6d49008acb28\\4a245b22-67bb-49f7-bda2-40ee737b08a6.docx	5b12f7ea-ab09-4be3-9b29-86f119698022
bce5c83f-3a0b-4c86-8309-ec61f834d862	2026-05-04 14:05:50.668637	2026-05-04 14:05:50.668637	ADPY_Report.pdf	15181	application/pdf	C:\\Users\\userMe\\Documents\\AntigravityProjects\\ai-project-management\\pmanage\\uploads\\chat\\8a2725d1-162a-4fb9-ba46-6d49008acb28\\2178e767-b337-4a21-a977-ce85633d713a.pdf	1f47cd4f-aa22-4721-9e71-692ced96e43b
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, created_at, updated_at, content, message_type, project_id, user_id, recipient_id) FROM stdin;
822f27ac-92e9-4b2d-a0cb-70b3c8bf6411	2026-04-20 15:08:34.103271	2026-04-20 15:08:34.103271	#[ADPY-4](84d799a8-1801-488a-aaac-3cacd7c209be) 	TEXT	8a2725d1-162a-4fb9-ba46-6d49008acb28	1	3
ab19b0b9-1109-4418-a3f5-58467104ec3b	2026-04-20 14:00:47.307752	2026-04-20 14:00:47.307752	@[Erdal Akyuz](1) @[Ahmet Mehmet](3) #[ADPY-7](8032a342-610c-4278-a49d-9f74ee89b3ad) #[ADPY-5](889b4a5a-0dde-4399-bac6-bb81b99487b6) 	TEXT	8a2725d1-162a-4fb9-ba46-6d49008acb28	3	1
1f47cd4f-aa22-4721-9e71-692ced96e43b	2026-05-04 14:05:50.665947	2026-05-04 14:05:50.671615	Shared a file: ADPY_Report.pdf	FILE	8a2725d1-162a-4fb9-ba46-6d49008acb28	1	\N
8e282e52-c275-4e0b-a450-aadbb02fe9cd	2026-05-04 15:37:09.114814	2026-05-04 15:37:23.924325	fdsfdsFDSFDSFDS	TEXT	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	7	3
77191b0f-63fb-4da2-bd4a-26dd8e9855bb	2026-05-04 15:39:16.065607	2026-05-04 15:39:16.065607	FDSF	TEXT	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	1	7
f184b45a-7f87-49d1-b706-b5ebbec5139d	2026-05-04 15:39:16.740199	2026-05-04 15:39:16.740199	FDS	TEXT	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	1	7
8cf44452-6dbc-425a-b977-6bd433b817e3	2026-05-04 15:39:17.052037	2026-05-04 15:39:17.052037	fds	TEXT	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	1	7
8d0b97c7-b0ba-41c4-b0bb-e91ffe7780b0	2026-05-04 15:39:17.337621	2026-05-04 15:39:17.337621	fds	TEXT	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	1	7
a980dd51-05eb-41a0-8008-584934be0b40	2026-05-04 15:37:14.57224	2026-05-04 15:44:19.321136	fdsafsadFDFD	TEXT	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	7	1
5b12f7ea-ab09-4be3-9b29-86f119698022	2026-04-20 14:13:00.854241	2026-04-20 14:13:00.880765	Shared a file: 4.hafta_rapor_erdal_akyuz.docx	FILE	8a2725d1-162a-4fb9-ba46-6d49008acb28	3	1
861c6a0a-f2a8-4cb8-bcd4-f775592555c9	2026-05-11 14:25:24.211563	2026-05-11 14:25:24.211563	l	TEXT	8a2725d1-162a-4fb9-ba46-6d49008acb28	1	\N
bcae3ea5-1c7c-4e47-8249-2cb775c0c4f7	2026-04-20 13:40:31.554918	2026-04-20 14:43:54.90945	#[ADPY-1](c0ba4532-7348-4775-a1da-9409aea2cd50)  #[ADPY-5](889b4a5a-0dde-4399-bac6-bb81b99487b6) \n\nIssue etiketleme\n	TEXT	8a2725d1-162a-4fb9-ba46-6d49008acb28	3	\N
d5379240-3287-4880-9430-c036a26aab58	2026-04-20 13:39:50.214642	2026-04-20 13:39:50.214642	Deneme	TEXT	8a2725d1-162a-4fb9-ba46-6d49008acb28	3	\N
c4bbfbc8-80f0-4be6-9329-0006372cd2cc	2026-04-20 13:39:58.484879	2026-04-20 13:39:58.484879	@[Erdal Akyuz](1) Mention deneme	TEXT	8a2725d1-162a-4fb9-ba46-6d49008acb28	3	\N
e71f26f8-f05a-4978-92d8-ffa49588c9de	2026-04-20 13:42:40.406051	2026-04-20 13:42:40.424097	Shared a file: pexels-therato-1933239.jpg	FILE	8a2725d1-162a-4fb9-ba46-6d49008acb28	3	\N
19724cba-f074-4cfa-8cbc-931d402ebdfa	2026-04-20 13:42:45.435974	2026-04-20 13:42:45.451678	Shared a file: pexels-visit-greenland-108649-360912.jpg	FILE	8a2725d1-162a-4fb9-ba46-6d49008acb28	3	\N
d1b165de-0bc5-403d-a300-f387c988310a	2026-04-20 13:40:50.611351	2026-04-20 14:44:12.782901	#[ADPY-6](fb3128a7-aa9f-4c9f-b49f-1729a7ea470a) #[ADPY-4](84d799a8-1801-488a-aaac-3cacd7c209be) #[ADPY-1](c0ba4532-7348-4775-a1da-9409aea2cd50)	TEXT	8a2725d1-162a-4fb9-ba46-6d49008acb28	3	\N
dd81a827-c5a0-45c0-8d37-28f2cd0151df	2026-04-20 13:43:09.250417	2026-04-20 13:43:09.259735	Shared a file: Proje_Oneri_Erdal_Akyuz.docx	FILE	8a2725d1-162a-4fb9-ba46-6d49008acb28	3	\N
41c01407-8bd5-45c7-bf58-2850a74b2382	2026-04-20 14:48:39.088729	2026-04-20 14:48:39.088729	Deneme	TEXT	8a2725d1-162a-4fb9-ba46-6d49008acb28	1	3
\.


--
-- Data for Name: chat_read_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_read_receipts (id, created_at, updated_at, read_at, last_read_message_id, project_id, user_id) FROM stdin;
\.


--
-- Data for Name: chat_read_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_read_status (id, created_at, updated_at, last_read_at, peer_id, project_id, user_id) FROM stdin;
a6ff8df5-6310-477e-9790-204e3fae8ecc	2026-04-20 15:34:28.684779	2026-05-04 13:34:06.720274	2026-05-04 13:34:06.709495	\N	8a2725d1-162a-4fb9-ba46-6d49008acb28	3
25fb8b46-ee31-466b-82dd-aaecb3c7b83e	2026-05-04 13:37:11.425333	2026-05-04 13:37:11.425333	2026-05-04 13:37:11.424844	\N	964d95ab-5cda-4e1e-a6e7-6479735f6ba5	3
883c9685-588f-461b-825e-80394d4df892	2026-05-04 13:37:11.398766	2026-05-04 13:37:11.439044	2026-05-04 13:37:11.428888	\N	964d95ab-5cda-4e1e-a6e7-6479735f6ba5	3
149191ef-aec5-44c7-bd47-9bcad4ad98f6	2026-05-04 15:37:00.288154	2026-05-04 15:44:12.69871	2026-05-04 15:44:12.690799	\N	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	7
eefcfa77-fba5-4027-8d43-fd6dfc6ce8b7	2026-05-04 15:37:02.088384	2026-05-04 15:44:14.158034	2026-05-04 15:44:14.15703	4	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	7
afad5d08-daeb-48e7-b0cc-3ce5648b5a8e	2026-05-04 15:37:01.56755	2026-05-04 15:44:14.730204	2026-05-04 15:44:14.730204	3	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	7
d79bbc71-2a0d-4515-9873-aed3277541da	2026-05-04 15:19:13.706625	2026-05-04 15:19:13.706625	2026-05-04 15:19:13.70602	\N	b1fc2f05-9905-4780-adf0-298c114491e3	6
df049547-3a86-4f03-a968-22255e8e844d	2026-05-04 15:19:13.734582	2026-05-04 15:19:13.734582	2026-05-04 15:19:13.73408	\N	b1fc2f05-9905-4780-adf0-298c114491e3	6
38066945-1ba2-4365-a616-b4864e2205c6	2026-05-04 15:19:13.744133	2026-05-04 15:19:13.744133	2026-05-04 15:19:13.743142	\N	b1fc2f05-9905-4780-adf0-298c114491e3	6
74249a66-69c7-49ae-bbf4-afe32cbad125	2026-05-04 15:37:02.664274	2026-05-04 15:44:15.257061	2026-05-04 15:44:15.256106	1	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	7
b7e5ae0b-865f-4fea-aedc-d30b046da3e6	2026-04-20 19:38:07.700345	2026-05-11 09:16:09.494067	2026-05-11 09:16:09.494067	3	8a2725d1-162a-4fb9-ba46-6d49008acb28	1
7bd62da6-70be-4137-ad0f-08149c0fed7f	2026-05-04 15:39:01.290346	2026-05-04 15:47:54.646701	2026-05-04 15:47:54.646701	4	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	1
d8526f0d-d39f-4a5e-bdcb-3b9f47d550c4	2026-04-20 19:38:04.020257	2026-05-11 14:25:57.920534	2026-05-11 14:25:57.908534	\N	8a2725d1-162a-4fb9-ba46-6d49008acb28	1
af4c9dca-50f6-473d-98f8-e33e33a10867	2026-05-04 15:38:54.657087	2026-05-11 14:31:08.945725	2026-05-11 14:31:08.937187	\N	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	1
45980d69-af86-4c06-a746-2099a50e4ac4	2026-05-04 15:38:55.973623	2026-05-11 14:31:12.774205	2026-05-11 14:31:12.773193	7	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	1
519c53c4-c815-475a-84f0-bb06616d0b16	2026-04-20 15:34:31.424923	2026-05-04 13:33:44.09303	2026-05-04 13:33:44.092015	1	8a2725d1-162a-4fb9-ba46-6d49008acb28	3
279943dd-5373-4e83-aedf-c04b94fb54cf	2026-05-04 15:39:00.510475	2026-05-11 14:31:13.377744	2026-05-11 14:31:13.37649	3	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	1
\.


--
-- Data for Name: issue_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issue_comments (id, content, created_at, author_id, issue_id, updated_at) FROM stdin;
80a6acda-0756-418f-8579-03ceae7c9cc8	@[Erdal Akyuz](1) \n\n#[ADPY-5](889b4a5a-0dde-4399-bac6-bb81b99487b6) 	2026-04-19 14:33:42.797524	1	c0ba4532-7348-4775-a1da-9409aea2cd50	2026-04-19 14:33:42.797524
12d4e415-da8e-4893-bb6a-d118b1a67a5b	@[Erdal Akyuz](1) E\n	2026-04-20 15:08:52.549963	1	84d799a8-1801-488a-aaac-3cacd7c209be	2026-04-20 15:08:52.549963
b19d1c3e-eed9-46fe-a655-5be012dca8cb	#[ADPY-4](84d799a8-1801-488a-aaac-3cacd7c209be) 	2026-04-20 15:09:01.269969	1	84d799a8-1801-488a-aaac-3cacd7c209be	2026-04-20 15:09:01.269969
\.


--
-- Data for Name: issue_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issue_history (id, created_at, field, new_value, old_value, issue_id, user_id) FROM stdin;
5cfa3990-5b34-4636-80e7-893117cacf31	2026-04-13 12:33:40.732079	status	DONE	TODO	c7073492-4cf1-4bf0-8495-708d46f240a4	1
e2ba0afc-59ed-4cbd-8263-9efe1898b0da	2026-04-13 12:36:06.62764	epic	ADPY-1	\N	2b5a607f-3491-4d42-992d-4727457be380	1
804d5c8d-9464-4a31-a713-ace8d8f02249	2026-04-13 12:36:09.24584	status	DONE	TODO	2b5a607f-3491-4d42-992d-4727457be380	1
8ccc08ee-8599-4773-9e9a-4c884c4dac50	2026-04-13 12:43:51.770977	status	DONE	TODO	84d799a8-1801-488a-aaac-3cacd7c209be	1
dccb377a-b0ae-4f1f-855b-d5f9855892f3	2026-04-13 12:45:28.383001	status	DONE	TODO	889b4a5a-0dde-4399-bac6-bb81b99487b6	1
51e36406-c9da-4bc2-9c80-4e79542c5ea3	2026-04-13 12:47:22.145643	status	DONE	TODO	fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	1
ec5615f4-7513-4d00-80d9-edec86e16867	2026-04-13 12:49:29.778627	status	TODO	DONE	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	1
b23845f2-55ac-4f97-8ceb-3b12b6e1e470	2026-04-13 12:50:18.768619	status	TODO	DONE	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
750ce68a-095b-49ca-b0f5-5559c6d6c21e	2026-04-13 12:51:38.057488	status	IN_PROGRESS	TODO	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	1
4cc417f6-b0c3-4147-abc5-3e3f320f5755	2026-04-13 12:53:52.926813	description	<p><strong>8.Hafta Raporlama: OpenPDF ile proje raporlarının PDF formatında indirilmesini sağlayan uç noktaların tamamlanması. Görev tablolarının formatlı olarak PDF şeklinde indirilebilmesi Projenin raporlanma ihtiyacını karşılar. (%10)</strong></p><p></p><p></p><p></p>	8.Hafta\tRaporlama: OpenPDF ile proje raporlarının PDF formatında indirilmesini sağlayan uç noktaların tamamlanması.\n\nGörev tablolarının formatlı olarak PDF şeklinde indirilebilmesi Projenin raporlanma ihtiyacını karşılar. (%10)	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
fb7e5902-b615-42e7-8133-17f88a41ea43	2026-04-13 12:55:24.146041	epic	ADPY-12	\N	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
74477235-e333-4765-a401-08c7b578441a	2026-04-13 12:55:35.338536	epic	ADPY-12	\N	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
e46e602c-28c3-4c22-af5f-e49366faa51b	2026-04-13 12:55:43.781422	epic	ADPY-12	\N	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
4532fd10-6860-4f0d-9131-a04869d6c5a8	2026-04-13 12:55:51.869697	epic	ADPY-12	\N	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	1
2be51c84-5bc8-4221-a90f-d4781021f654	2026-04-13 12:56:07.076868	epic	ADPY-12	\N	fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	1
dee4edcc-b625-4f95-a13b-3e8db6e2f640	2026-04-13 12:56:17.446975	epic	ADPY-12	\N	8032a342-610c-4278-a49d-9f74ee89b3ad	1
0ce80433-511b-44b2-847f-aab648047a70	2026-04-13 12:56:33.135089	epic	ADPY-12	ADPY-1	c7073492-4cf1-4bf0-8495-708d46f240a4	1
8dcefa15-a658-4708-b5d2-2beda413e057	2026-04-13 12:56:40.107244	epic	ADPY-12	ADPY-1	889b4a5a-0dde-4399-bac6-bb81b99487b6	1
b20f358e-206d-4b8f-b598-8668ff9ec5b3	2026-04-13 13:14:31.525505	description	<h1>7.Hafta Senkronize Chat </h1><ul><li><p><strong>Spring Boot WebSockets altyapısının kurulması. Proje bazlı anlık mesajlaşma ekranlarının arayüze bağlanarak test edilmesi. Çift yönlü mesaj iletiminin sayfa yenilenmeden anında gerçekleşmesi. Ekip içi eşzamanlı iletişimi ve işbirliğini sağlar. (%10)</strong></p></li></ul>	7.Hafta\tSenkronize Chat : Spring Boot WebSockets altyapısının kurulması. Proje bazlı anlık mesajlaşma ekranlarının arayüze bağlanarak test edilmesi.\n\nÇift yönlü mesaj iletiminin sayfa yenilenmeden anında gerçekleşmesi. Ekip içi eşzamanlı iletişimi ve işbirliğini sağlar.\n(%10)\n	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	1
16257923-b1cd-43ea-b291-b1865b3dfb01	2026-04-13 13:14:39.58695	status	IN_PROGRESS	TODO	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
61fd9a04-0a80-4be3-9059-68e0ed2b01a2	2026-04-13 13:14:42.201317	status	TODO	IN_PROGRESS	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
250abf87-8644-4a84-b0f5-6a6afe1bb773	2026-04-13 13:14:52.796805	status	IN_REVIEW	DONE	fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	1
0a070193-be44-4f08-b9ca-93563aa33dd3	2026-04-13 13:14:58.386841	status	IN_REVIEW	DONE	8032a342-610c-4278-a49d-9f74ee89b3ad	1
457dec81-56e2-4b00-a992-b43779974bfc	2026-04-13 13:15:23.70067	description	<h1>5.Hafta Görevler ve Filtreleme</h1><p></p><ul><li><p><strong>React arayüzünde Backlog ekranının geliştirilmesi. Görevleri kişiye, statüye ve projelere göre ayıklayacak dinamik filtreleme Görevlerin istenilen kriterlere göre filtrelenebilmesi. Kullanıcı deneyimini artırır ve iş takibini kolaylaştırır. (%10)</strong></p></li></ul>	5.Hafta\tGörevler ve Filtreleme: React arayüzünde Backlog ekranının geliştirilmesi. Görevleri kişiye, statüye ve projelere göre ayıklayacak dinamik filtreleme\t\n\nGörevlerin istenilen kriterlere göre filtrelenebilmesi. Kullanıcı deneyimini artırır ve iş takibini kolaylaştırır. (%10)\n\n	fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	1
9584d9fd-2e7b-469f-9ff5-07583e15b1fd	2026-04-13 13:15:23.701666	priority	HIGH	MEDIUM	fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	1
b025f321-781b-4787-ba45-937258280700	2026-04-13 13:22:23.312258	priority	MEDIUM	HIGH	fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	1
d5ae8bde-ad9f-47eb-b1c4-b702ed66a47f	2026-04-13 13:22:28.202306	priority	LOW	MEDIUM	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	1
e8d19675-7c53-449d-8070-629540aa64f7	2026-04-13 13:22:31.037199	priority	HIGH	LOW	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	1
a45c4f6c-1859-41b8-8844-7ac94ee13518	2026-04-13 13:22:40.7706	priority	LOW	MEDIUM	c7073492-4cf1-4bf0-8495-708d46f240a4	1
4aba4557-d817-447e-a149-83627315a4ae	2026-04-13 13:22:44.376776	priority	LOW	MEDIUM	8032a342-610c-4278-a49d-9f74ee89b3ad	1
a499b847-dfbe-4fd7-b78e-0fe936db358c	2026-04-13 13:22:51.565818	priority	HIGH	MEDIUM	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
d93edc5a-ba23-42b8-8d77-db161180ce47	2026-04-13 13:25:55.952814	epic	\N	ADPY-12	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
fc1d78f7-65ef-4c20-85e1-98a3ac70a29b	2026-04-13 13:26:00.912552	epic	\N	ADPY-12	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
4f96f62c-41a3-453f-9610-1907d3ab61ee	2026-04-13 13:26:12.391834	epic	ADPY-12	\N	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
98ada6a3-012c-4818-9525-9599263e9be4	2026-04-13 13:26:21.984376	epic	ADPY-12	\N	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
3be10931-2abd-4e4a-ac9b-fa7ac501419a	2026-04-13 13:27:19.621605	type	STORY	TASK	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	1
5648c7ee-ae81-4f04-8ee2-6a4e49b3fe3c	2026-03-31 20:24:08.567456	epic	TPTE-1	\N	3c38561b-2dd8-45a5-b4b2-db41f6077c00	4
9e15e1b3-92e5-4815-bfcf-12b92a0c91b1	2026-03-31 20:26:46.153161	epic	TPTE-1	\N	84bb6b01-b1f6-41ea-8800-53cb06b55e58	4
69b41148-5dd3-40d3-9f3d-09d00227831e	2026-03-31 20:27:32.826182	epic	\N	TPTE-1	84bb6b01-b1f6-41ea-8800-53cb06b55e58	4
0b1d6225-0b30-467c-955b-477cd857776c	2026-03-31 20:27:38.488558	epic	TPTE-1	\N	84bb6b01-b1f6-41ea-8800-53cb06b55e58	4
f22cba21-86dc-4c6c-9777-98717a4037f3	2026-04-13 13:27:31.809276	type	STORY	TASK	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
b4a07f67-bb4b-4331-8709-4d012d60ea64	2026-04-13 13:27:37.556199	type	STORY	TASK	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
719b71c4-76da-4dcf-82de-83ae92e8bad5	2026-04-13 13:27:42.9604	type	STORY	TASK	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
4bb36bb2-3c20-4436-a3a1-7d8cc7cf1f14	2026-04-13 13:27:49.648337	type	STORY	TASK	fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	1
92344ff2-8fcd-46b3-aea5-d06ff58862b9	2026-04-13 13:27:55.44767	type	STORY	TASK	8032a342-610c-4278-a49d-9f74ee89b3ad	1
ba1b8bd0-9265-4333-bd12-c2660e84c4dd	2026-04-13 13:28:07.337056	type	STORY	TASK	2b5a607f-3491-4d42-992d-4727457be380	1
3e5f3477-f74a-40b4-9413-ed7696b9ece9	2026-04-13 13:29:02.642544	status	IN_PROGRESS	TODO	c0ba4532-7348-4775-a1da-9409aea2cd50	1
1a74b398-53e6-41fa-bf54-536772f14bca	2026-04-13 13:29:04.587676	status	IN_PROGRESS	TODO	7fa5dbb7-db0a-4bfb-8848-12509746cbcd	1
4f6d530e-4e70-4657-8c33-10b074b84c8a	2026-04-13 13:29:07.600787	priority	HIGH	MEDIUM	c0ba4532-7348-4775-a1da-9409aea2cd50	1
8f090aa8-9247-4b34-898e-eb2fd4f3f51f	2026-04-13 13:48:05.007015	description	<h1><strong>8.Hafta Raporlama</strong></h1><p></p><ul><li><p><strong> OpenPDF ile proje raporlarının PDF formatında indirilmesini sağlayan uç noktaların tamamlanması. Görev tablolarının formatlı olarak PDF şeklinde indirilebilmesi Projenin raporlanma ihtiyacını karşılar. (%10)</strong></p></li></ul><p></p><p></p><p></p>	<p><strong>8.Hafta Raporlama: OpenPDF ile proje raporlarının PDF formatında indirilmesini sağlayan uç noktaların tamamlanması. Görev tablolarının formatlı olarak PDF şeklinde indirilebilmesi Projenin raporlanma ihtiyacını karşılar. (%10)</strong></p><p></p><p></p><p></p>	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
49a8eae1-864c-407d-bd94-805205ae84e3	2026-04-13 13:52:25.949244	assignee	\N	erdalakyuz33@gmail.com	c0ba4532-7348-4775-a1da-9409aea2cd50	1
5bc8a0a4-d3ed-4965-b3e7-256fe01bd875	2026-04-13 13:52:29.166726	assignee	erdalakyuz33@gmail.com	\N	c0ba4532-7348-4775-a1da-9409aea2cd50	1
b66e7916-6261-4a02-97e2-9a0814674ce2	2026-04-13 14:10:26.231343	epic	\N	ADPY-1	84d799a8-1801-488a-aaac-3cacd7c209be	1
73aee589-2d66-4cba-a87c-899276fd7716	2026-04-13 14:10:36.256392	epic	ADPY-1	\N	84d799a8-1801-488a-aaac-3cacd7c209be	1
c897a5c7-278d-479c-9f3b-25c7183d456e	2026-04-13 14:29:30.43253	priority	MEDIUM	HIGH	c0ba4532-7348-4775-a1da-9409aea2cd50	1
505bd9b3-6a7a-4a2b-8412-787e8d7f24d7	2026-04-13 13:48:53.064652	description	<h1>Yapay Zeka Entegrasyonu</h1><hr><ul><li><p><strong>spring-ai-starter-model-google-genai kullanılarak Google Gemini API bağlantısının yapılması. Bir prompt ile sistemdeki verilerin okunarak yapılandırılmış özetlere dönüştürülmesi. Yapay zekanın sohbet geçmişini okuyarak yapılandırılmış anlamlı bir özet metni üretmesi. Araştırmanın özgün değerini ve yenilikçi yönünü kanıtlar. (%20)</strong></p></li></ul>	Yapay Zeka: spring-ai-starter-model-google-genai kullanılarak Google Gemini API bağlantısının yapılması. Bir prompt ile sistemdeki verilerin okunarak yapılandırılmış özetlere dönüştürülmesi.\t\n\nYapay zekanın sohbet geçmişini okuyarak yapılandırılmış anlamlı bir özet metni üretmesi. Araştırmanın özgün değerini ve yenilikçi yönünü kanıtlar. (%20)	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
c9c2b58f-20e2-468c-9f5e-f5b5a1f99051	2026-04-13 13:55:30.040121	description	<h1>7.Hafta Senkronize Chat</h1><hr><ul><li><p><strong>Spring Boot WebSockets altyapısının kurulması. Proje bazlı anlık mesajlaşma ekranlarının arayüze bağlanarak test edilmesi. Çift yönlü mesaj iletiminin sayfa yenilenmeden anında gerçekleşmesi. Ekip içi eşzamanlı iletişimi ve işbirliğini sağlar. (%10)</strong></p></li></ul><p></p>	<h1>7.Hafta Senkronize Chat </h1><ul><li><p><strong>Spring Boot WebSockets altyapısının kurulması. Proje bazlı anlık mesajlaşma ekranlarının arayüze bağlanarak test edilmesi. Çift yönlü mesaj iletiminin sayfa yenilenmeden anında gerçekleşmesi. Ekip içi eşzamanlı iletişimi ve işbirliğini sağlar. (%10)</strong></p></li></ul>	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	1
24106e63-63b3-4183-90b0-be7d1b76b21d	2026-04-13 14:45:11.410164	description	<h1>6.Hafta Kanban Panolar </h1><hr><ul><li><p><strong>Sürükle-bırak özellikli Kanban Board arayüzünün React üzerinde geliştirilmesi. Kart hareketlerinin backend'de anında güncellenmesi. Görev kartlarının sütunlar arası taşınıp durumunun veritabanında güncellenmesi. Çevik proje yönetiminin görsel temelini oluşturur. (%15)</strong></p></li></ul>	6.Hafta\tPanolar : Sürükle-bırak özellikli Kanban Board arayüzünün React üzerinde geliştirilmesi. Kart hareketlerinin backend'de anında güncellenmesi.\t\n\nGörev kartlarının sütunlar arası taşınıp durumunun veritabanında güncellenmesi. Çevik proje yönetiminin görsel temelini oluşturur. (%15)	8032a342-610c-4278-a49d-9f74ee89b3ad	1
3f76944c-acf0-4a7c-b14a-c9074a08a2c0	2026-04-13 14:45:21.669916	description	<h1>5.Hafta Görevler ve Filtreleme</h1><hr><ul><li><p><strong>React arayüzünde Backlog ekranının geliştirilmesi. Görevleri kişiye, statüye ve projelere göre ayıklayacak dinamik filtreleme Görevlerin istenilen kriterlere göre filtrelenebilmesi. Kullanıcı deneyimini artırır ve iş takibini kolaylaştırır. (%10)</strong></p></li></ul>	<h1>5.Hafta Görevler ve Filtreleme</h1><p></p><ul><li><p><strong>React arayüzünde Backlog ekranının geliştirilmesi. Görevleri kişiye, statüye ve projelere göre ayıklayacak dinamik filtreleme Görevlerin istenilen kriterlere göre filtrelenebilmesi. Kullanıcı deneyimini artırır ve iş takibini kolaylaştırır. (%10)</strong></p></li></ul>	fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	1
ab340ed0-eddb-4682-9a14-f9aaa5d61bfa	2026-04-13 15:39:45.421636	status	IN_PROGRESS	TODO	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
df1e7cf6-0aca-4dbd-8a1c-e95e165f76df	2026-04-13 15:41:19.441972	epic	\N	ADPY-12	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
b3c3c89c-a7b5-4846-a48c-2cca12da899c	2026-04-13 15:41:40.751532	epic	\N	ADPY-12	8032a342-610c-4278-a49d-9f74ee89b3ad	1
e7e4c45a-da9a-477f-8431-711f31e282e0	2026-04-13 15:42:58.506265	status	TODO	IN_PROGRESS	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
1ac7c0fc-d24b-4958-b427-e3cc012e6e49	2026-04-13 15:44:06.930607	epic	ADPY-12	\N	8032a342-610c-4278-a49d-9f74ee89b3ad	1
bedbe992-c4c5-4b84-a020-7afdd4be835d	2026-04-13 15:44:35.64382	epic	ADPY-12	\N	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
86d8d5e4-3ecf-4f75-8f02-e7b35a24c2dd	2026-04-13 15:47:03.501821	status	IN_PROGRESS	TODO	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
903f15ef-e65f-40cc-8c6c-11c138da5632	2026-04-13 15:47:06.120499	status	TODO	IN_PROGRESS	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
5ee702e1-eb38-426c-ae83-1e54148820a6	2026-04-13 22:36:55.144525	status	DONE	IN_REVIEW	fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	1
4b124cc6-3f45-4414-b5da-b339927e54f1	2026-04-13 22:36:56.489007	status	DONE	IN_REVIEW	8032a342-610c-4278-a49d-9f74ee89b3ad	1
d0d7ed04-1860-44ab-84b6-f3df746cbe7f	2026-04-13 22:46:35.991282	epic	\N	ADPY-12	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
367621c3-85aa-433d-9933-ee8ba851deb7	2026-04-13 22:49:27.90592	assignee	ahmet@gmail.com	erdalakyuz33@gmail.com	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	3
79b22823-3c5e-4864-824b-ab685b104e03	2026-04-13 22:54:12.243444	status	IN_REVIEW	IN_PROGRESS	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	3
6e5a9400-b069-4323-a32b-290312a52d10	2026-04-13 22:54:13.441245	status	IN_PROGRESS	IN_REVIEW	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	3
f2eb5f7a-1c37-4ab8-bf50-551a060b5b3a	2026-04-13 22:54:21.217525	status	IN_REVIEW	IN_PROGRESS	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	3
b8049130-1755-4eb0-be8c-7e5fd9fe4a64	2026-04-13 22:54:22.906005	status	IN_PROGRESS	IN_REVIEW	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	3
7d8be780-b431-4d93-be4e-8b4deda193f1	2026-04-13 22:55:05.016707	assignee	erdalakyuz33@gmail.com	ahmet@gmail.com	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	3
9feeb5c2-c5a9-46f9-90ee-5e272418722b	2026-04-19 21:34:53.1311	status	IN_REVIEW	IN_PROGRESS	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	3
0f264029-ad2e-4fea-a4e0-4f92f581b03f	2026-04-19 21:36:06.631171	epic	ADPY-1	\N	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	3
61786bd3-8027-4335-b794-c1b52adceef7	2026-04-19 21:36:14.929635	epic	ADPY-12	ADPY-1	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	3
fb6d7dfb-6ecc-4f9f-844b-c472140a9021	2026-04-27 20:30:31.517588	status	DONE	IN_REVIEW	5a1e4587-53f4-4811-9ecb-4cbfd85a6275	1
768adf89-a1de-4e88-984f-110f602096c2	2026-05-04 09:37:35.371779	status	IN_PROGRESS	TODO	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
fab0f6ca-8368-4fc2-9813-35d7e62304e1	2026-05-04 09:37:37.729534	status	IN_PROGRESS	TODO	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
bb6a0e02-3268-4adb-9193-1c3bf34f4af6	2026-05-04 12:45:13.538813	epic	\N	ADPY-12	889b4a5a-0dde-4399-bac6-bb81b99487b6	1
8779ea40-338f-4228-9653-58a44f5b8ff9	2026-05-04 12:45:21.981968	epic	\N	ADPY-12	8032a342-610c-4278-a49d-9f74ee89b3ad	1
377c4495-c9d1-400d-8f9a-b05ae514fccc	2026-05-04 12:45:41.825525	epic	ADPY-12	\N	8032a342-610c-4278-a49d-9f74ee89b3ad	1
fca3ac4e-4d31-460a-abbb-39c9fbae5d61	2026-05-04 12:45:50.923284	epic	ADPY-12	\N	889b4a5a-0dde-4399-bac6-bb81b99487b6	1
0a2dce96-f7b0-4a85-8eab-021c5837b0c5	2026-05-04 12:45:58.632906	epic	\N	ADPY-12	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
4013a66c-52cc-4ad9-a0da-e829bfe26410	2026-05-04 13:55:01.732465	status	IN_REVIEW	IN_PROGRESS	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
01ecafb5-5f96-428d-aa43-ac5e41a8cd00	2026-05-04 13:55:06.899611	status	IN_PROGRESS	IN_REVIEW	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
3a26ad72-7ab9-45fc-99c7-7ad3e6ecb42b	2026-05-04 14:02:11.650562	status	DONE	IN_PROGRESS	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
23962e67-196d-46e8-9d8a-a272ba4be3a0	2026-05-04 14:02:45.653426	status	DONE	IN_PROGRESS	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
bc2cf91b-69d4-4dec-a2c0-d12db35a534c	2026-05-04 14:02:48.576927	status	DONE	TODO	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
8cdded64-df6b-4496-9abc-7c4db5ad0e53	2026-05-04 14:04:20.321765	status	TODO	DONE	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
234ffbfb-c150-4ec1-b1c6-f89fb2276523	2026-05-04 14:04:22.837016	status	IN_PROGRESS	DONE	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
cfe177fa-ff1a-4421-af35-45503468358a	2026-05-04 14:04:28.690388	status	IN_REVIEW	DONE	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
9fba4fc5-b509-4087-a9a2-cf637adb8077	2026-05-04 15:17:46.997743	description	<p>10.Hafta Birim Testleri: Spring Boot arka ucu için JUnit kullanılarak testlerin yazılması. Sistemin hatasız çalışması ve arayüzün akıcılığının doğrulanması. Uygulamanın kararlılığını netleştirir. (%5).</p>	10.Hafta\tBirim Testleri: Spring Boot arka ucu için JUnit kullanılarak testlerin yazılması.\t             \n\nSistemin hatasız çalışması ve arayüzün akıcılığının doğrulanması. Uygulamanın kararlılığını netleştirir. (%5)	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
a98baec9-864e-4f49-9045-11c730976d2b	2026-05-04 15:21:37.741321	status	TODO	IN_PROGRESS	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
0646f246-21a8-48df-8eb4-c618f6041b80	2026-05-04 15:21:39.564762	status	IN_PROGRESS	TODO	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
180046f5-71ef-457e-9d63-dda382bf0ff6	2026-05-04 15:21:45.347359	status	TODO	IN_PROGRESS	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
d3f60ee5-6fac-487e-bcd1-e1cb43bba65d	2026-05-04 15:22:01.938826	status	IN_PROGRESS	TODO	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
b49b9b04-b386-4cf4-a9c8-cf396a09c0e9	2026-05-04 15:22:52.857458	status	IN_PROGRESS	IN_REVIEW	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
4302411c-b32d-4e4e-8741-1d479f14b163	2026-05-04 15:33:24.377602	title	Login - Authh	Login - Auth	c0ba4532-7348-4775-a1da-9409aea2cd50	1
c606a4a1-82e5-41a7-b03d-a6d5224bd7bb	2026-05-04 15:33:30.053988	title	Login - Auth	Login - Authh	c0ba4532-7348-4775-a1da-9409aea2cd50	1
96c87523-d887-4180-9f3d-c35879b98f69	2026-05-04 15:35:27.50911	status	IN_PROGRESS	TODO	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
7161ab76-7d28-47b4-9185-ca7acf8f60a2	2026-05-04 15:35:28.755586	status	TODO	IN_PROGRESS	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
bc3a0419-e214-447f-ba9d-52540cb9c903	2026-05-04 15:36:27.640473	status	IN_PROGRESS	TODO	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
f0659958-3693-47ae-a72a-1f4cc12180d0	2026-05-04 15:36:28.955593	status	IN_REVIEW	IN_PROGRESS	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
6cd04d9d-9887-423b-9e83-2ed154a4dccf	2026-05-04 15:36:35.47585	status	TODO	IN_REVIEW	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
c6994853-183c-4aee-ada8-1bd0e38cb2f8	2026-05-04 15:36:37.099309	status	DONE	TODO	f807f0e8-030c-4f92-88b3-2a9b849bc7dc	7
2abd5072-93f3-4626-89c6-c12d10a78446	2026-05-04 15:36:38.56249	status	IN_REVIEW	DONE	f807f0e8-030c-4f92-88b3-2a9b849bc7dc	7
e665d068-baca-4d0b-bae5-2cf9a456c5d0	2026-05-04 15:36:40.427004	status	DONE	IN_REVIEW	f807f0e8-030c-4f92-88b3-2a9b849bc7dc	7
6c7fb229-5000-4fc7-be81-05d73521a238	2026-05-04 15:36:42.011003	status	DONE	TODO	8e6f0964-be9e-4580-a4d5-92712eaf3c7a	7
a903793a-2ea2-4237-beb0-879b90591e58	2026-05-04 15:36:43.401103	status	IN_PROGRESS	TODO	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
03e5302b-12e8-40e3-88c6-b1ed6126a6ed	2026-05-04 15:36:45.121009	status	TODO	IN_PROGRESS	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
47126eea-6e88-49f3-9fc8-571bf236b653	2026-05-04 15:36:46.361345	status	IN_PROGRESS	DONE	8e6f0964-be9e-4580-a4d5-92712eaf3c7a	7
777557fe-83a6-41dc-b726-f3cbca798711	2026-05-04 15:36:48.115332	priority	HIGH	MEDIUM	f807f0e8-030c-4f92-88b3-2a9b849bc7dc	7
99b3f4bf-3ff0-4dd5-b227-f791e0d90b37	2026-05-04 15:43:29.977107	status	IN_PROGRESS	TODO	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
0e76f25d-a886-4470-bd8b-de98079dfc22	2026-05-04 15:43:30.97396	status	IN_REVIEW	IN_PROGRESS	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
374d17c3-ff1f-46fc-93aa-67ec95b62e4c	2026-05-04 15:43:32.019199	status	DONE	IN_REVIEW	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
65c6aac6-6cc9-4baf-9982-c96bc400b5e1	2026-05-04 15:43:37.995334	status	TODO	IN_PROGRESS	8e6f0964-be9e-4580-a4d5-92712eaf3c7a	7
760f8273-3992-443a-afb5-9fed5143a6ec	2026-05-04 15:43:41.745377	status	IN_REVIEW	DONE	9ec7de83-03a4-4832-8890-61c53ce7b25d	7
fe92cb14-b16b-4df9-a345-8ed892f32fd5	2026-05-04 15:43:55.076469	status	IN_PROGRESS	TODO	8e6f0964-be9e-4580-a4d5-92712eaf3c7a	7
f915b519-b2fd-457e-b957-c4a6056468ca	2026-05-04 15:43:55.857998	status	TODO	IN_PROGRESS	8e6f0964-be9e-4580-a4d5-92712eaf3c7a	7
3e8325ce-1b05-4e38-baf0-d878d1cee88c	2026-05-04 15:51:52.368227	status	IN_PROGRESS	TODO	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
e77da282-d44c-49b6-9846-03d26322cb9d	2026-05-04 15:51:54.073594	status	TODO	IN_PROGRESS	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
cc35e438-74f1-4873-b075-f5285d061411	2026-05-10 21:25:45.182884	status	IN_PROGRESS	TODO	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
37402aae-faf7-485b-abad-df6e9a0d0ca9	2026-05-10 21:25:46.417901	status	TODO	IN_PROGRESS	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
e4013ff6-4ef2-438c-be64-a650278283d4	2026-05-10 21:28:11.146565	status	DONE	TODO	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
f945e7b1-9a98-4a3b-927c-729f632df377	2026-05-10 21:33:35.289316	status	TODO	DONE	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
b6ef0f75-32bd-4e86-8702-c0cf90f43585	2026-05-10 21:34:49.350758	status	DONE	TODO	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
9ffb8e8d-598b-45de-84b2-4fa074edcc0f	2026-05-10 21:57:03.470277	status	TODO	DONE	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
db032704-0bbd-43be-92d8-d9195f79c977	2026-05-10 22:03:02.177597	status	DONE	TODO	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
ad349922-82a8-4785-b9a3-35f4b537b9f1	2026-05-10 22:03:09.901613	status	TODO	DONE	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
3fa4af27-8b96-490b-b4bd-4c0fd18f60c6	2026-05-11 08:54:58.852209	assignee	ahmet@gmail.com	erdalakyuz33@gmail.com	84d799a8-1801-488a-aaac-3cacd7c209be	1
502c8b13-77e3-4e45-a2da-13d989d9b958	2026-05-11 08:55:07.239818	assignee	ahmet@gmail.com	erdalakyuz33@gmail.com	2b5a607f-3491-4d42-992d-4727457be380	1
ca7937c1-9a24-4812-8046-6cf710ad3170	2026-05-11 13:34:06.399522	priority	MEDIUM	LOW	5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	1
842be2b4-f158-49c5-8747-c115057acc49	2026-05-11 13:34:22.998639	status	IN_REVIEW	IN_PROGRESS	e55c981b-52f5-4ef9-b6ca-295ee6df3047	1
d369b14d-31f7-4c60-8531-3b39840c68c0	2026-05-11 13:34:26.286498	status	IN_REVIEW	IN_PROGRESS	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1
f39c5ccb-78e6-4f03-8d23-8cab895d2625	2026-05-11 14:15:29.224397	status	TODO	IN_PROGRESS	490ff33a-98a2-4165-9615-773218c72e45	1
66e812dd-2af4-4de7-b516-36e7c5067985	2026-05-11 14:15:30.626532	status	IN_PROGRESS	TODO	490ff33a-98a2-4165-9615-773218c72e45	1
\.


--
-- Data for Name: issue_labels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issue_labels (issue_id, label) FROM stdin;
7fa5dbb7-db0a-4bfb-8848-12509746cbcd	Core
7fa5dbb7-db0a-4bfb-8848-12509746cbcd	UI
c7073492-4cf1-4bf0-8495-708d46f240a4	Core
8032a342-610c-4278-a49d-9f74ee89b3ad	UI
fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	Core
fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	UI
889b4a5a-0dde-4399-bac6-bb81b99487b6	Core
c0ba4532-7348-4775-a1da-9409aea2cd50	Auth
c0ba4532-7348-4775-a1da-9409aea2cd50	Security
e55c981b-52f5-4ef9-b6ca-295ee6df3047	UI
e55c981b-52f5-4ef9-b6ca-295ee6df3047	Core
8cc51519-510c-49f3-ac82-59a4d07f0b6d	AI
8cc51519-510c-49f3-ac82-59a4d07f0b6d	Security
8cc51519-510c-49f3-ac82-59a4d07f0b6d	UI
9ec7de83-03a4-4832-8890-61c53ce7b25d	klkl
490ff33a-98a2-4165-9615-773218c72e45	Security
490ff33a-98a2-4165-9615-773218c72e45	Auth
5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	Test
5a1e4587-53f4-4811-9ecb-4cbfd85a6275	Core
5a1e4587-53f4-4811-9ecb-4cbfd85a6275	UI
84d799a8-1801-488a-aaac-3cacd7c209be	Security
2b5a607f-3491-4d42-992d-4727457be380	Auth
\.


--
-- Data for Name: issues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issues (id, created_at, description, end_date, issue_key, priority, start_date, status, title, type, updated_at, assignee_id, epic_id, project_id, parent_id, "position", ai_assignment_reason) FROM stdin;
35fc2aa8-536d-4d36-a033-96ca5910763e	2026-03-31 20:22:56.81007		\N	TPTE-1	MEDIUM	\N	TODO	Project Foundation	EPIC	2026-03-31 20:27:25.206588	4	\N	c1d2a606-690b-464d-8cdb-76e5afd4f7e1	\N	\N	\N
84bb6b01-b1f6-41ea-8800-53cb06b55e58	2026-03-31 20:25:04.856013		\N	TPTE-3	MEDIUM	\N	TODO	Third Task	TASK	2026-03-31 20:27:38.491752	4	35fc2aa8-536d-4d36-a033-96ca5910763e	c1d2a606-690b-464d-8cdb-76e5afd4f7e1	\N	\N	\N
c7073492-4cf1-4bf0-8495-708d46f240a4	2026-04-13 12:33:37.334217	Temel Kurulumlar: Spring Boot ve React projelerinin ayağa kaldırılması. pgAdmin üzerinden PostgreSQL veritabanı bağlantılarının yapılması ve mimari yapının (MVC) oluşturulması.\n\nUygulama iskeletinin hatasız derlenmesi ve veritabanı bağlantısının aktif olması Projenin geliştirileceği altyapının başarıyla kurulmasını sağlar. (%5)	2026-03-11	ADPY-2	LOW	2026-02-24	DONE	1.Hafta / Temel Kurulumlar	TASK	2026-04-13 15:26:06.24156	1	7fa5dbb7-db0a-4bfb-8848-12509746cbcd	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	1000	\N
5a1e4587-53f4-4811-9ecb-4cbfd85a6275	2026-04-13 12:49:22.507168	<h1>7.Hafta Senkronize Chat</h1><hr><ul><li><p><strong>Spring Boot WebSockets altyapısının kurulması. Proje bazlı anlık mesajlaşma ekranlarının arayüze bağlanarak test edilmesi. Çift yönlü mesaj iletiminin sayfa yenilenmeden anında gerçekleşmesi. Ekip içi eşzamanlı iletişimi ve işbirliğini sağlar. (%10)</strong></p></li></ul><p></p>	2026-04-20	ADPY-8	HIGH	2026-04-13	DONE	7.Hafta / Canlı Sohbet	STORY	2026-05-10 21:58:47.624414	1	7fa5dbb7-db0a-4bfb-8848-12509746cbcd	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	62.5	\N
889b4a5a-0dde-4399-bac6-bb81b99487b6	2026-04-13 12:45:23.66412	4.Hafta\tHiyerarşik Model : Proje, Epik, Görev yapısının PostgreSQL ve JPA/Hibernate ile tablolarının oluşturulması ve temel CRUD özellikleri eklenmesi.\t\n\nHiyerarşik verilerin veritabanına eksiksiz kaydedilip okunabilmesi. Proje yönetiminin veri organizasyonunu çalışır hale getirir. (%10)\n\n	2026-04-07	ADPY-5	MEDIUM	\N	DONE	4.Hafta / Crud Özellikleri	TASK	2026-05-04 12:45:50.929045	1	7fa5dbb7-db0a-4bfb-8848-12509746cbcd	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	500	\N
7fa5dbb7-db0a-4bfb-8848-12509746cbcd	2026-04-13 12:55:14.536191	<h1>Uygulamanın desteklemesi gereken çekirdek özellikler</h1><p></p><p></p>	2026-05-22	ADPY-12	HIGH	\N	IN_PROGRESS	Genel Uygulama Özellikleri	EPIC	2026-04-13 13:29:04.596201	1	\N	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	459752	\N
8032a342-610c-4278-a49d-9f74ee89b3ad	2026-04-13 12:48:36.08565	<h1>6.Hafta Kanban Panolar </h1><hr><ul><li><p><strong>Sürükle-bırak özellikli Kanban Board arayüzünün React üzerinde geliştirilmesi. Kart hareketlerinin backend'de anında güncellenmesi. Görev kartlarının sütunlar arası taşınıp durumunun veritabanında güncellenmesi. Çevik proje yönetiminin görsel temelini oluşturur. (%15)</strong></p></li></ul>	2026-04-15	ADPY-7	LOW	\N	DONE	6.Hafta / Kanban Sürükle - Bırak Özelliği 	STORY	2026-05-04 15:24:44.886154	1	7fa5dbb7-db0a-4bfb-8848-12509746cbcd	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	125	\N
fb3128a7-aa9f-4c9f-b49f-1729a7ea470a	2026-04-13 12:47:14.870685	<h1>5.Hafta Görevler ve Filtreleme</h1><hr><ul><li><p><strong>React arayüzünde Backlog ekranının geliştirilmesi. Görevleri kişiye, statüye ve projelere göre ayıklayacak dinamik filtreleme Görevlerin istenilen kriterlere göre filtrelenebilmesi. Kullanıcı deneyimini artırır ve iş takibini kolaylaştırır. (%10)</strong></p></li></ul>	2026-04-15	ADPY-6	MEDIUM	\N	DONE	5.Hafta / Backlog ve Filtreleme	STORY	2026-05-04 15:24:50.554058	1	7fa5dbb7-db0a-4bfb-8848-12509746cbcd	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	250	\N
2b5a607f-3491-4d42-992d-4727457be380	2026-04-13 12:35:58.762922	Güvenlik: Spring Security ile kullanıcı giriş ve kayıt özellikleri eklenmesi. React tarafında giriş ekranlarının tasarlanması.\n\n2.Hafta\tGüvenlik: Spring Security ile kullanıcı giriş ve kayıt özellikleri eklenmesi. React tarafında giriş ekranlarının tasarlanması.\tErdal Akyüz\tKullanıcı giriş ve kayıt ekranlarının Spring Security ile frontend entegrasyonu yoluyla test edilmesi. Veri girişi ve temel oturum akışını güvence altına alır. (%10)	2026-04-22	ADPY-3	MEDIUM	2026-04-08	DONE	2.Hafta / Auth ve Login	STORY	2026-05-11 08:55:07.248851	3	c0ba4532-7348-4775-a1da-9409aea2cd50	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	875	\N
3c38561b-2dd8-45a5-b4b2-db41f6077c00	2026-03-31 20:23:24.950806		\N	TPTE-2	MEDIUM	\N	TODO	Initial SetupInitial Setup	TASK	2026-03-31 20:24:08.57335	4	35fc2aa8-536d-4d36-a033-96ca5910763e	c1d2a606-690b-464d-8cdb-76e5afd4f7e1	\N	\N	\N
5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d	2026-04-13 12:51:34.618951	<p>10.Hafta Birim Testleri: Spring Boot arka ucu için JUnit kullanılarak testlerin yazılması. Sistemin hatasız çalışması ve arayüzün akıcılığının doğrulanması. Uygulamanın kararlılığını netleştirir. (%5).</p>	\N	ADPY-11	MEDIUM	\N	TODO	10.Hafta / JUnit ile test senaryoları	STORY	2026-05-11 15:28:33.113323	1	7fa5dbb7-db0a-4bfb-8848-12509746cbcd	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	1000	\N
84d799a8-1801-488a-aaac-3cacd7c209be	2026-04-13 12:43:47.72854	Veri Doğrulama: Spring Boot tarafında backend validasyonlarının yazılması. React ile anlık form hata bildirimlerinin tamamlanması.\t\n\nBoş veya hatalı form gönderimlerinin sistem tarafından reddedilmesi. Veritabanına hatalı veri girişini engelleyerek kararlılığı artırır. (%5)\n\n	2026-04-14	ADPY-4	HIGH	\N	DONE	3.Hafta / Validation	TASK	2026-05-11 08:54:58.876206	3	c0ba4532-7348-4775-a1da-9409aea2cd50	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	750	\N
c0ba4532-7348-4775-a1da-9409aea2cd50	2026-04-13 12:32:15.393633	Spring Security ile kullanıcı giriş ve kayıt özellikleri eklenmesi. React tarafında giriş ekranlarının tasarlanması.\n\nKullanıcı giriş ve kayıt ekranlarının Spring Security ile frontend entegrasyonu yoluyla test edilmesi. Veri girişi ve temel oturum akışını güvence altına alır. (%10)	2026-05-22	ADPY-1	MEDIUM	\N	IN_PROGRESS	Login - Auth	EPIC	2026-05-04 15:33:30.056989	1	\N	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	65536	\N
8cc51519-510c-49f3-ac82-59a4d07f0b6d	2026-04-13 12:51:03.44606	<h1>Yapay Zeka Entegrasyonu</h1><hr><ul><li><p><strong>spring-ai-starter-model-google-genai kullanılarak Google Gemini API bağlantısının yapılması. Bir prompt ile sistemdeki verilerin okunarak yapılandırılmış özetlere dönüştürülmesi. Yapay zekanın sohbet geçmişini okuyarak yapılandırılmış anlamlı bir özet metni üretmesi. Araştırmanın özgün değerini ve yenilikçi yönünü kanıtlar. (%20)</strong></p></li></ul>	2026-04-16	ADPY-10	HIGH	\N	IN_REVIEW	9.Hafta / Yapay Zeka Entegrasyonu	STORY	2026-05-11 13:34:26.29619	1	7fa5dbb7-db0a-4bfb-8848-12509746cbcd	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	2000	\N
f807f0e8-030c-4f92-88b3-2a9b849bc7dc	2026-05-04 15:35:44.601696		2026-05-31	IPLC-4	HIGH	\N	DONE	FDSFDSFDS	STORY	2026-05-04 15:40:59.925734	7	\N	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	\N	132072	\N
9ec7de83-03a4-4832-8890-61c53ce7b25d	2026-05-04 15:35:23.680059		2026-05-13	IPLC-2	MEDIUM	\N	IN_REVIEW	FDSFDSFDSFDS	TASK	2026-05-04 15:43:41.749376	7	\N	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	\N	1000	\N
8e6f0964-be9e-4580-a4d5-92712eaf3c7a	2026-05-04 15:35:39.893594		2026-05-26	IPLC-3	MEDIUM	\N	TODO	FDSFDS	BUG	2026-05-04 15:43:55.861542	7	\N	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	\N	1000	\N
e55c981b-52f5-4ef9-b6ca-295ee6df3047	2026-04-13 12:50:12.226154	<h1><strong>8.Hafta Raporlama</strong></h1><p></p><ul><li><p><strong> OpenPDF ile proje raporlarının PDF formatında indirilmesini sağlayan uç noktaların tamamlanması. Görev tablolarının formatlı olarak PDF şeklinde indirilebilmesi Projenin raporlanma ihtiyacını karşılar. (%10)</strong></p></li></ul><p></p><p></p><p></p>	2026-04-15	ADPY-9	MEDIUM	\N	IN_REVIEW	8.Hafta / Çıktı oluşturma Raporlama	STORY	2026-05-11 13:34:23.009664	1	\N	8a2725d1-162a-4fb9-ba46-6d49008acb28	8cc51519-510c-49f3-ac82-59a4d07f0b6d	1000	\N
490ff33a-98a2-4165-9615-773218c72e45	2026-05-11 13:50:11.005365	<p>Arayüzlerdeki validasyon hataları ve bazı doğrulama hatalarının düzeltilmesi gerekiyor.</p>	2026-05-18	ADPY-23	MEDIUM	2026-05-07	IN_PROGRESS	Validasyon ve doğrulama hataları	BUG	2026-05-11 14:26:32.526401	\N	c0ba4532-7348-4775-a1da-9409aea2cd50	8a2725d1-162a-4fb9-ba46-6d49008acb28	\N	1000	\N
\.


--
-- Data for Name: labels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.labels (id, color, name, project_id) FROM stdin;
2	#14b8a6	132123456456789789879789879	964d95ab-5cda-4e1e-a6e7-6479735f6ba5
3	#22c55e	UI	8a2725d1-162a-4fb9-ba46-6d49008acb28
4	#22c55e	Auth	8a2725d1-162a-4fb9-ba46-6d49008acb28
5	#ef4444	Security	8a2725d1-162a-4fb9-ba46-6d49008acb28
6	#14b8a6	AI	8a2725d1-162a-4fb9-ba46-6d49008acb28
7	#6366f1	Core	8a2725d1-162a-4fb9-ba46-6d49008acb28
8	#ec4899	Test	8a2725d1-162a-4fb9-ba46-6d49008acb28
10	#f97316	klkl	6d50473b-5f6f-4dc8-9182-a25277dcaaa0
\.


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_members (created_at, updated_at, user_id, id, project_id, role, last_read_chat_at) FROM stdin;
2026-05-04 15:34:58.763066	2026-05-11 14:31:08.945725	1	bf031092-d2b0-41ec-bd04-413132913ed7	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	PROJECT_MEMBER	2026-05-11 14:31:08.943729
2026-05-04 15:18:23.890117	2026-05-04 15:18:23.890117	2	4656de6d-21ee-4405-9d6f-f40be22c80eb	b1fc2f05-9905-4780-adf0-298c114491e3	PROJECT_MANAGER	\N
2026-05-04 15:18:23.890117	2026-05-04 15:18:23.890117	3	735477da-6090-45a7-85b5-94c64f53a531	b1fc2f05-9905-4780-adf0-298c114491e3	PROJECT_MEMBER	\N
2026-05-04 15:18:23.890117	2026-05-04 15:19:13.751641	6	b08bf741-c8ea-400a-a4a1-9edabdf4b0be	b1fc2f05-9905-4780-adf0-298c114491e3	PROJECT_MANAGER	2026-05-04 15:19:13.750641
2026-03-31 20:21:56.57458	2026-03-31 20:21:56.57458	4	63fc5055-5310-49a8-a057-a27ba73c6d56	c1d2a606-690b-464d-8cdb-76e5afd4f7e1	PROJECT_MANAGER	\N
2026-05-04 15:55:39.674507	2026-05-04 15:55:39.674507	3	96246452-5e0c-4e01-9283-d3c68011227a	8a2725d1-162a-4fb9-ba46-6d49008acb28	PROJECT_MEMBER	\N
2026-05-04 15:34:58.763066	2026-05-04 15:34:58.763066	3	f91eb92a-14a8-4ae0-b3cb-29f90b40fca5	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	PROJECT_MANAGER	\N
2026-05-04 15:34:58.763066	2026-05-04 15:34:58.763066	4	fb620818-eb1a-4f6c-9a62-fd82bb420da8	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	PROJECT_MEMBER	\N
2026-03-23 14:11:02.30656	2026-03-23 14:11:02.30656	2	29792b0e-711a-4331-bfa6-eff3a038eeb1	964d95ab-5cda-4e1e-a6e7-6479735f6ba5	PROJECT_MEMBER	\N
2026-03-23 14:11:02.300557	2026-05-04 13:37:11.439228	3	77b0f578-fa2b-4cb6-9200-25a108ebfc68	964d95ab-5cda-4e1e-a6e7-6479735f6ba5	PROJECT_MANAGER	2026-05-04 13:37:11.436514
2026-05-04 15:34:58.763066	2026-05-04 15:44:12.69871	7	c1486933-4fcc-4a9d-a3c1-e2c6c3ca9c33	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	PROJECT_MANAGER	2026-05-04 15:44:12.69853
2026-05-04 15:55:39.667507	2026-05-11 14:25:57.920534	1	d15c8158-acb0-428e-89f2-29beddfcba34	8a2725d1-162a-4fb9-ba46-6d49008acb28	PROJECT_MANAGER	2026-05-11 14:25:57.919531
\.


--
-- Data for Name: project_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_reports (id, accomplishments, blockers, completed_issues, created_at, executive_summary, issues_by_assignee_json, issues_by_priority_json, issues_by_status_json, issues_by_type_json, next_steps, project_key, project_name, team_dynamics, total_issues, total_messages, generated_by_id, project_id, risk_assessment, sprint_health, velocity_analysis, overdue_issues, unassigned_issues, issue_snapshots_json, message_snapshots_json) FROM stdin;
de17ed78-57b2-463c-b133-f36f9b076583	- **Erdal Akyuz** successfully completed **ADPY-11**, focusing on JUnit test scenarios.\n- The team delivered key UI features like **ADPY-6** (Backlog and Filtering) and **ADPY-7** (Kanban Drag-and-Drop) thanks to **Erdal Akyuz**.\n- Core functionalities such as **ADPY-5** (CRUD Features) and **ADPY-8** (Live Chat) were also marked as **DONE** by **Erdal Akyuz**.\n- Essential setup and security tasks, including **ADPY-2** (Basic Setups), **ADPY-4** (Validation), and **ADPY-3** (Auth and Login), were completed earlier by **Erdal Akyuz**.	- We currently have two issues, **ADPY-9** (Reporting) and **ADPY-10** (AI Integration), that are **OVERDUE** and still **IN_PROGRESS**.\n- The entire project workload, including all active and overdue tasks, is currently assigned to **Erdal Akyuz**.\n- Two major epics, **ADPY-1** (Login - Auth) and **ADPY-12** (General Application Features), are still **IN_PROGRESS** and due by May 22nd.	8	2026-05-10 21:56:25.830775	The AI Destekli Proje Yönetim Sistemi project is progressing with a 66.7% completion rate. We've made good strides in completing core features and tests. However, we need to address two overdue issues and the concentrated workload on **Erdal Akyuz** to maintain momentum and ensure timely delivery.	{"Erdal Akyuz":12}	{"HIGH":4,"MEDIUM":5,"LOW":3}	{"IN_PROGRESS":4,"DONE":8}	{"TASK":3,"EPIC":2,"STORY":7}	- Review and re-distribute the workload to balance tasks across the team, especially for **Ahmet Mehmet**.\n- Immediately prioritize and resolve the overdue issues **ADPY-9** (Reporting) and **ADPY-10** (AI Integration).\n- Have a quick sync to discuss the progress and remaining work for epics **ADPY-1** and **ADPY-12**.\n- Encourage more active participation and task ownership from **Ahmet Mehmet**.	ADPY	AI Destekli Proje Yönetim Sistemi	- **Erdal Akyuz** has been the primary driver, completing all 8 **DONE** issues and managing all active tasks.\n- Chat activity shows **Ahmet Mehmet** engaged in testing chat features and sharing files in April.\n- **Erdal Akyuz** shared a project report in early May.\n- We need to foster more collaborative task execution and ensure both team members are actively contributing to issue resolution.	12	8	1	8a2725d1-162a-4fb9-ba46-6d49008acb28	- **Risk**: Single point of failure due to all active tasks being assigned to **Erdal Akyuz**.\n  - **Likelihood**: High\n  - **Mitigation**: Distribute tasks more evenly and empower **Ahmet Mehmet** to take ownership of specific areas.\n- **Risk**: Delays in critical features due to overdue high-priority tasks like **ADPY-10** (AI Integration).\n  - **Likelihood**: Medium\n  - **Mitigation**: Dedicate focused effort to complete overdue items and re-evaluate their dependencies.	- We have 4 issues currently **IN_PROGRESS**, with 2 of them being **OVERDUE**.\n- All active work is concentrated on **Erdal Akyuz**, which could lead to bottlenecks.\n- The project health is currently **Needs Attention** due to overdue tasks and workload imbalance.	- The project has a solid completion rate of 66.7%, with 8 out of 12 issues successfully marked as **DONE**.\n- **Erdal Akyuz** has been highly productive, completing 8 tasks and currently managing 4 active ones.\n- While many stories have been completed, the remaining **IN_PROGRESS** items include two epics and two overdue stories, indicating a need for focused effort on larger deliverables.\n- The team has shown consistent progress in completing weekly tasks, but the current workload distribution is a concern.	2	0	[{"id":"5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d","issueKey":"ADPY-11","title":"10.Hafta / JUnit ile test senaryoları","description":null,"type":"STORY","status":"DONE","priority":"LOW","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":null,"labels":["Test"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"5a1e4587-53f4-4811-9ecb-4cbfd85a6275","issueKey":"ADPY-8","title":"7.Hafta / Canlı Sohbet","description":null,"type":"STORY","status":"DONE","priority":"HIGH","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-20","labels":["Core","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"8032a342-610c-4278-a49d-9f74ee89b3ad","issueKey":"ADPY-7","title":"6.Hafta / Kanban Sürükle - Bırak Özelliği ","description":null,"type":"STORY","status":"DONE","priority":"LOW","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-15","labels":["UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"fb3128a7-aa9f-4c9f-b49f-1729a7ea470a","issueKey":"ADPY-6","title":"5.Hafta / Backlog ve Filtreleme","description":null,"type":"STORY","status":"DONE","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-15","labels":["Core","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"e55c981b-52f5-4ef9-b6ca-295ee6df3047","issueKey":"ADPY-9","title":"8.Hafta / Çıktı oluşturma Raporlama","description":null,"type":"STORY","status":"IN_PROGRESS","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-15","labels":["UI","Core"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"889b4a5a-0dde-4399-bac6-bb81b99487b6","issueKey":"ADPY-5","title":"4.Hafta / Crud Özellikleri","description":null,"type":"TASK","status":"DONE","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-07","labels":["Core"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"84d799a8-1801-488a-aaac-3cacd7c209be","issueKey":"ADPY-4","title":"3.Hafta / Validation","description":null,"type":"TASK","status":"DONE","priority":"HIGH","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-14","labels":["Security"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"2b5a607f-3491-4d42-992d-4727457be380","issueKey":"ADPY-3","title":"2.Hafta / Auth ve Login","description":null,"type":"STORY","status":"DONE","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-22","labels":["Auth"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"8cc51519-510c-49f3-ac82-59a4d07f0b6d","issueKey":"ADPY-10","title":"9.Hafta / Yapay Zeka Entegrasyonu","description":null,"type":"STORY","status":"IN_PROGRESS","priority":"HIGH","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-16","labels":["AI","Security","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"c7073492-4cf1-4bf0-8495-708d46f240a4","issueKey":"ADPY-2","title":"1.Hafta / Temel Kurulumlar","description":null,"type":"TASK","status":"DONE","priority":"LOW","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-03-11","labels":["Core"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"c0ba4532-7348-4775-a1da-9409aea2cd50","issueKey":"ADPY-1","title":"Login - Auth","description":null,"type":"EPIC","status":"IN_PROGRESS","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-05-22","labels":["Auth","Security"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"7fa5dbb7-db0a-4bfb-8848-12509746cbcd","issueKey":"ADPY-12","title":"Genel Uygulama Özellikleri","description":null,"type":"EPIC","status":"IN_PROGRESS","priority":"HIGH","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-05-22","labels":["Core","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null}]	[{"id":"1f47cd4f-aa22-4721-9e71-692ced96e43b","content":"Shared a file: ADPY_Report.pdf","senderEmail":"erdalakyuz33@gmail.com","senderFirstName":"Erdal","senderLastName":"Akyuz","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"bce5c83f-3a0b-4c86-8309-ec61f834d862","fileName":"ADPY_Report.pdf","fileType":"application/pdf","fileSize":15181,"downloadUrl":"/api/chat/files/bce5c83f-3a0b-4c86-8309-ec61f834d862/download","createdAt":"2026-05-04T14:05:50.668637","messageId":"1f47cd4f-aa22-4721-9e71-692ced96e43b"}],"createdAt":"2026-05-04T14:05:50.665947","updatedAt":"2026-05-04T14:05:50.671615"},{"id":"dd81a827-c5a0-45c0-8d37-28f2cd0151df","content":"Shared a file: Proje_Oneri_Erdal_Akyuz.docx","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"b749d095-920c-4044-9bcb-4ff642d4bf12","fileName":"Proje_Oneri_Erdal_Akyuz.docx","fileType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","fileSize":74691,"downloadUrl":"/api/chat/files/b749d095-920c-4044-9bcb-4ff642d4bf12/download","createdAt":"2026-04-20T13:43:09.253651","messageId":"dd81a827-c5a0-45c0-8d37-28f2cd0151df"}],"createdAt":"2026-04-20T13:43:09.250417","updatedAt":"2026-04-20T13:43:09.259735"},{"id":"19724cba-f074-4cfa-8cbc-931d402ebdfa","content":"Shared a file: pexels-visit-greenland-108649-360912.jpg","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"39147cd5-138e-43ef-905d-2b4186fbe092","fileName":"pexels-visit-greenland-108649-360912.jpg","fileType":"image/jpeg","fileSize":1055582,"downloadUrl":"/api/chat/files/39147cd5-138e-43ef-905d-2b4186fbe092/download","createdAt":"2026-04-20T13:42:45.439904","messageId":"19724cba-f074-4cfa-8cbc-931d402ebdfa"}],"createdAt":"2026-04-20T13:42:45.435974","updatedAt":"2026-04-20T13:42:45.451678"},{"id":"e71f26f8-f05a-4978-92d8-ffa49588c9de","content":"Shared a file: pexels-therato-1933239.jpg","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"c8fb352e-f13f-41d8-84bf-7f06c220fb59","fileName":"pexels-therato-1933239.jpg","fileType":"image/jpeg","fileSize":1197216,"downloadUrl":"/api/chat/files/c8fb352e-f13f-41d8-84bf-7f06c220fb59/download","createdAt":"2026-04-20T13:42:40.414158","messageId":"e71f26f8-f05a-4978-92d8-ffa49588c9de"}],"createdAt":"2026-04-20T13:42:40.406051","updatedAt":"2026-04-20T13:42:40.424097"},{"id":"d1b165de-0bc5-403d-a300-f387c988310a","content":"#[ADPY-6](fb3128a7-aa9f-4c9f-b49f-1729a7ea470a) #[ADPY-4](84d799a8-1801-488a-aaac-3cacd7c209be) #[ADPY-1](c0ba4532-7348-4775-a1da-9409aea2cd50)","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:40:50.611351","updatedAt":"2026-04-20T14:44:12.782901"},{"id":"bcae3ea5-1c7c-4e47-8249-2cb775c0c4f7","content":"#[ADPY-1](c0ba4532-7348-4775-a1da-9409aea2cd50)  #[ADPY-5](889b4a5a-0dde-4399-bac6-bb81b99487b6) \\n\\nIssue etiketleme\\n","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:40:31.554918","updatedAt":"2026-04-20T14:43:54.90945"},{"id":"c4bbfbc8-80f0-4be6-9329-0006372cd2cc","content":"@[Erdal Akyuz](1) Mention deneme","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:39:58.484879","updatedAt":null},{"id":"d5379240-3287-4880-9430-c036a26aab58","content":"Deneme","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:39:50.214642","updatedAt":null}]
737edd1b-b90e-4f1e-a4f4-850f42cb15bc	- **Ahmet Mehmet** recently completed **ADPY-3** (Auth and Login) and **ADPY-4** (Validation). Great work, Ahmet!\n- **Erdal Akyuz** finished **ADPY-8** (Live Chat) last week.\n- We also wrapped up core features like **ADPY-6** (Backlog and Filtering) and **ADPY-7** (Kanban Drag-Drop).\n- **ADPY-5** (CRUD Features) and **ADPY-2** (Initial Setup) were also successfully completed.	- **ADPY-9** (Reporting) is overdue by 26 days and currently in review. This needs to be pushed forward.\n- **ADPY-10** (AI Integration) is also overdue by 25 days and in review, which is a high-priority item.\n- Bug **ADPY-23** (Validation and authentication errors) is currently unassigned and in progress. It needs an owner immediately.\n- **Erdal Akyuz** has a high workload with 2 active issues and 2 overdue issues, which could create a bottleneck.	7	2026-05-11 14:17:10.165385	The project is currently at 53.8% completion, showing good initial progress. However, our overall health is at 'Needs Attention' due to two critical, overdue issues in review. Addressing these items and an unassigned bug is our top priority to maintain momentum and ensure smooth delivery.	{"Unassigned":1,"Ahmet Mehmet":2,"Erdal Akyuz":10}	{"HIGH":4,"MEDIUM":7,"LOW":2}	{"IN_PROGRESS":3,"TODO":1,"DONE":7,"IN_REVIEW":2}	{"TASK":3,"EPIC":2,"BUG":1,"STORY":7}	- **Erdal Akyuz** should prioritize completing the review and closing **ADPY-9** (Reporting) and **ADPY-10** (AI Integration).\n- Assign **ADPY-23** (Validation and authentication errors) to a team member, likely **Ahmet Mehmet**, to resolve the bug promptly.\n- Plan for **ADPY-11** (JUnit with test scenarios) to move from 'To Do' to 'In Progress' soon.\n- Review the overall workload distribution to ensure tasks are balanced and no single team member is overloaded.	ADPY	AI Destekli Proje Yönetim Sistemi	- Team chat activity has been relatively low recently, with the last message from **Ahmet Mehmet** on April 20th and **Erdal Akyuz** on May 4th.\n- Both team members have shared files, including a project report from **Erdal Akyuz**.\n- **Ahmet Mehmet** effectively used issue tags and mentions in earlier chat messages, which is good for communication.\n- We could benefit from more regular, brief check-ins or status updates in the chat to maintain a consistent communication flow.	13	8	1	8a2725d1-162a-4fb9-ba46-6d49008acb28	- **Risk: Overdue Critical Features** (Likelihood: High) - **ADPY-9** (Reporting) and **ADPY-10** (AI Integration) are overdue and stuck in review.\n    - *Mitigation:* **Erdal Akyuz** needs to prioritize immediate review and finalization of these tasks.\n- **Risk: Unassigned Critical Bug** (Likelihood: Medium) - **ADPY-23** is an active bug without an assignee, potentially delaying resolution.\n    - *Mitigation:* Assign the bug to **Ahmet Mehmet** for immediate attention and resolution.\n- **Risk: Workload Imbalance** (Likelihood: Medium) - **Erdal Akyuz** is managing a significant number of active and overdue tasks.\n    - *Mitigation:* Redistribute upcoming tasks, such as **ADPY-11**, to balance the load and prevent further delays.	- Overall project health is currently **Needs Attention** due to several key items being stalled.\n- Two high-priority stories, **ADPY-9** (Reporting) and **ADPY-10** (AI Integration), are overdue and stuck in the 'In Review' status.\n- One bug, **ADPY-23**, is in progress but unassigned, creating a potential bottleneck.\n- **ADPY-11** (JUnit Tests) is waiting in the 'To Do' column, indicating a need to pull new work.	- We've completed 7 out of 13 issues, achieving a 53.8% completion rate, which is a solid foundation.\n- **Ahmet Mehmet** has completed all 2 of his assigned tasks, demonstrating strong individual velocity.\n- **Erdal Akyuz** has completed 5 out of 10 tasks but currently has 2 active and 2 overdue items, indicating a potential slowdown in his flow.\n- The presence of 2 issues in 'In Review' and 1 in 'To Do' suggests a need to improve the flow of tasks through the pipeline and reduce waiting times.	2	1	[{"id":"5a1e4587-53f4-4811-9ecb-4cbfd85a6275","issueKey":"ADPY-8","title":"7.Hafta / Canlı Sohbet","description":null,"type":"STORY","status":"DONE","priority":"HIGH","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-20","labels":["Core","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"8032a342-610c-4278-a49d-9f74ee89b3ad","issueKey":"ADPY-7","title":"6.Hafta / Kanban Sürükle - Bırak Özelliği ","description":null,"type":"STORY","status":"DONE","priority":"LOW","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-15","labels":["UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"fb3128a7-aa9f-4c9f-b49f-1729a7ea470a","issueKey":"ADPY-6","title":"5.Hafta / Backlog ve Filtreleme","description":null,"type":"STORY","status":"DONE","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-15","labels":["Core","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"889b4a5a-0dde-4399-bac6-bb81b99487b6","issueKey":"ADPY-5","title":"4.Hafta / Crud Özellikleri","description":null,"type":"TASK","status":"DONE","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-07","labels":["Core"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"84d799a8-1801-488a-aaac-3cacd7c209be","issueKey":"ADPY-4","title":"3.Hafta / Validation","description":null,"type":"TASK","status":"DONE","priority":"HIGH","assigneeName":"Ahmet Mehmet","assigneeId":3,"assigneeEmail":"ahmet@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-14","labels":["Security"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"2b5a607f-3491-4d42-992d-4727457be380","issueKey":"ADPY-3","title":"2.Hafta / Auth ve Login","description":null,"type":"STORY","status":"DONE","priority":"MEDIUM","assigneeName":"Ahmet Mehmet","assigneeId":3,"assigneeEmail":"ahmet@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-22","labels":["Auth"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"490ff33a-98a2-4165-9615-773218c72e45","issueKey":"ADPY-23","title":"Validasyon ve doğrulama hataları","description":null,"type":"BUG","status":"IN_PROGRESS","priority":"MEDIUM","assigneeName":null,"assigneeId":null,"assigneeEmail":null,"projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-05-18","labels":["Security","Auth"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"e55c981b-52f5-4ef9-b6ca-295ee6df3047","issueKey":"ADPY-9","title":"8.Hafta / Çıktı oluşturma Raporlama","description":null,"type":"STORY","status":"IN_REVIEW","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-15","labels":["UI","Core"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d","issueKey":"ADPY-11","title":"10.Hafta / JUnit ile test senaryoları","description":null,"type":"STORY","status":"TODO","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":null,"labels":["Test"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"c7073492-4cf1-4bf0-8495-708d46f240a4","issueKey":"ADPY-2","title":"1.Hafta / Temel Kurulumlar","description":null,"type":"TASK","status":"DONE","priority":"LOW","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-03-11","labels":["Core"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"8cc51519-510c-49f3-ac82-59a4d07f0b6d","issueKey":"ADPY-10","title":"9.Hafta / Yapay Zeka Entegrasyonu","description":null,"type":"STORY","status":"IN_REVIEW","priority":"HIGH","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-16","labels":["AI","Security","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"c0ba4532-7348-4775-a1da-9409aea2cd50","issueKey":"ADPY-1","title":"Login - Auth","description":null,"type":"EPIC","status":"IN_PROGRESS","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-05-22","labels":["Auth","Security"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"7fa5dbb7-db0a-4bfb-8848-12509746cbcd","issueKey":"ADPY-12","title":"Genel Uygulama Özellikleri","description":null,"type":"EPIC","status":"IN_PROGRESS","priority":"HIGH","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-05-22","labels":["Core","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null}]	[{"id":"1f47cd4f-aa22-4721-9e71-692ced96e43b","content":"Shared a file: ADPY_Report.pdf","senderEmail":"erdalakyuz33@gmail.com","senderFirstName":"Erdal","senderLastName":"Akyuz","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"bce5c83f-3a0b-4c86-8309-ec61f834d862","fileName":"ADPY_Report.pdf","fileType":"application/pdf","fileSize":15181,"downloadUrl":"/api/chat/files/bce5c83f-3a0b-4c86-8309-ec61f834d862/download","createdAt":"2026-05-04T14:05:50.668637","messageId":"1f47cd4f-aa22-4721-9e71-692ced96e43b"}],"createdAt":"2026-05-04T14:05:50.665947","updatedAt":"2026-05-04T14:05:50.671615"},{"id":"dd81a827-c5a0-45c0-8d37-28f2cd0151df","content":"Shared a file: Proje_Oneri_Erdal_Akyuz.docx","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"b749d095-920c-4044-9bcb-4ff642d4bf12","fileName":"Proje_Oneri_Erdal_Akyuz.docx","fileType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","fileSize":74691,"downloadUrl":"/api/chat/files/b749d095-920c-4044-9bcb-4ff642d4bf12/download","createdAt":"2026-04-20T13:43:09.253651","messageId":"dd81a827-c5a0-45c0-8d37-28f2cd0151df"}],"createdAt":"2026-04-20T13:43:09.250417","updatedAt":"2026-04-20T13:43:09.259735"},{"id":"19724cba-f074-4cfa-8cbc-931d402ebdfa","content":"Shared a file: pexels-visit-greenland-108649-360912.jpg","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"39147cd5-138e-43ef-905d-2b4186fbe092","fileName":"pexels-visit-greenland-108649-360912.jpg","fileType":"image/jpeg","fileSize":1055582,"downloadUrl":"/api/chat/files/39147cd5-138e-43ef-905d-2b4186fbe092/download","createdAt":"2026-04-20T13:42:45.439904","messageId":"19724cba-f074-4cfa-8cbc-931d402ebdfa"}],"createdAt":"2026-04-20T13:42:45.435974","updatedAt":"2026-04-20T13:42:45.451678"},{"id":"e71f26f8-f05a-4978-92d8-ffa49588c9de","content":"Shared a file: pexels-therato-1933239.jpg","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"c8fb352e-f13f-41d8-84bf-7f06c220fb59","fileName":"pexels-therato-1933239.jpg","fileType":"image/jpeg","fileSize":1197216,"downloadUrl":"/api/chat/files/c8fb352e-f13f-41d8-84bf-7f06c220fb59/download","createdAt":"2026-04-20T13:42:40.414158","messageId":"e71f26f8-f05a-4978-92d8-ffa49588c9de"}],"createdAt":"2026-04-20T13:42:40.406051","updatedAt":"2026-04-20T13:42:40.424097"},{"id":"d1b165de-0bc5-403d-a300-f387c988310a","content":"#[ADPY-6](fb3128a7-aa9f-4c9f-b49f-1729a7ea470a) #[ADPY-4](84d799a8-1801-488a-aaac-3cacd7c209be) #[ADPY-1](c0ba4532-7348-4775-a1da-9409aea2cd50)","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:40:50.611351","updatedAt":"2026-04-20T14:44:12.782901"},{"id":"bcae3ea5-1c7c-4e47-8249-2cb775c0c4f7","content":"#[ADPY-1](c0ba4532-7348-4775-a1da-9409aea2cd50)  #[ADPY-5](889b4a5a-0dde-4399-bac6-bb81b99487b6) \\n\\nIssue etiketleme\\n","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:40:31.554918","updatedAt":"2026-04-20T14:43:54.90945"},{"id":"c4bbfbc8-80f0-4be6-9329-0006372cd2cc","content":"@[Erdal Akyuz](1) Mention deneme","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:39:58.484879","updatedAt":null},{"id":"d5379240-3287-4880-9430-c036a26aab58","content":"Deneme","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:39:50.214642","updatedAt":null}]
c3c91f46-209f-4c0a-9ac4-36b8262e907c	- **Ahmet Mehmet** recently completed **ADPY-3** (Auth ve Login) and **ADPY-4** (Validation).\n- **Erdal Akyuz** wrapped up several key stories, including **ADPY-8** (Canlı Sohbet), **ADPY-6** (Backlog ve Filtreleme), and **ADPY-7** (Kanban Sürükle - Bırak Özelliği).\n- We've made solid progress on core features, with 7 issues now marked as **DONE**.	- Two important stories, **ADPY-9** (Raporlama) and **ADPY-10** (Yapay Zeka Entegrasyonu), are overdue and stuck in **IN_REVIEW** status. This is holding up progress.\n- The bug **ADPY-23** (Validasyon ve doğrulama hataları) is **IN_PROGRESS** but currently unassigned, meaning no one is actively working on it.\n- **Erdal Akyuz** has a heavier active workload with two **IN_PROGRESS** and two overdue **IN_REVIEW** items, while **Ahmet Mehmet** has no active tasks.	7	2026-05-11 15:28:22.562303	Hey team, quick update on our AI Destekli Proje Yönetim Sistemi. We're at 53.8% completion, which is good progress. However, we have a couple of overdue items in review and an unassigned bug that needs our immediate attention. Let's focus on clearing these bottlenecks this week.	{"Unassigned":1,"Ahmet Mehmet":2,"Erdal Akyuz":10}	{"HIGH":4,"MEDIUM":7,"LOW":2}	{"IN_PROGRESS":3,"TODO":1,"DONE":7,"IN_REVIEW":2}	{"TASK":3,"EPIC":2,"BUG":1,"STORY":7}	- 1. Assign **ADPY-23** (Validasyon ve doğrulama hataları) to a team member right away and get it fixed.\n- 2. **Erdal Akyuz**, please prioritize finalizing the reviews for **ADPY-9** (Raporlama) and **ADPY-10** (Yapay Zeka Entegrasyonu) to move them to **DONE**.\n- 3. Let's sync up to re-distribute active tasks, especially considering **Ahmet Mehmet**'s current availability.\n- 4. Plan for starting **ADPY-11** (JUnit ile test senaryoları) once the current bottlenecks are cleared.	ADPY	AI Destekli Proje Yönetim Sistemi	- Chat activity has been light, with some file sharing from **Ahmet Mehmet** and **Erdal Akyuz**.\n- It looks like we could benefit from more direct communication in chat about current tasks and any challenges.\n- Let's use the chat more actively to coordinate on **IN_REVIEW** items and the unassigned bug.	13	9	1	8a2725d1-162a-4fb9-ba46-6d49008acb28	- Risk: Overdue **IN_REVIEW** items (**ADPY-9**, **ADPY-10**).\n  - Likelihood: Medium.\n  - Mitigation: Prioritize review and finalization of these tasks immediately.\n- Risk: Unassigned **IN_PROGRESS** bug (**ADPY-23**).\n  - Likelihood: High.\n  - Mitigation: Assign this bug to a team member and prioritize its resolution.\n- Risk: Imbalanced workload distribution.\n  - Likelihood: Medium.\n  - Mitigation: Re-evaluate active assignments to ensure a more even spread of tasks.	- Overall project health is **Needs Attention** this week.\n- We have 3 issues currently **In Progress** and 2 in **In Review**.\n- Two key stories, **ADPY-9** (Raporlama) and **ADPY-10** (Yapay Zeka Entegrasyonu), are overdue and still in review. We need to push these to completion.\n- A critical bug, **ADPY-23**, is currently **In Progress** but unassigned, which is a concern.	- We've completed 7 out of 13 issues, bringing our completion rate to 53.8%.\n- The team has shown good recent velocity, with 7 issues completed since late April.\n- Workload distribution needs attention; **Erdal Akyuz** is managing all active and overdue tasks, while **Ahmet Mehmet** has capacity.	2	1	[{"id":"5a1e4587-53f4-4811-9ecb-4cbfd85a6275","issueKey":"ADPY-8","title":"7.Hafta / Canlı Sohbet","description":null,"type":"STORY","status":"DONE","priority":"HIGH","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-20","labels":["Core","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"8032a342-610c-4278-a49d-9f74ee89b3ad","issueKey":"ADPY-7","title":"6.Hafta / Kanban Sürükle - Bırak Özelliği ","description":null,"type":"STORY","status":"DONE","priority":"LOW","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-15","labels":["UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"fb3128a7-aa9f-4c9f-b49f-1729a7ea470a","issueKey":"ADPY-6","title":"5.Hafta / Backlog ve Filtreleme","description":null,"type":"STORY","status":"DONE","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-15","labels":["Core","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"889b4a5a-0dde-4399-bac6-bb81b99487b6","issueKey":"ADPY-5","title":"4.Hafta / Crud Özellikleri","description":null,"type":"TASK","status":"DONE","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-07","labels":["Core"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"84d799a8-1801-488a-aaac-3cacd7c209be","issueKey":"ADPY-4","title":"3.Hafta / Validation","description":null,"type":"TASK","status":"DONE","priority":"HIGH","assigneeName":"Ahmet Mehmet","assigneeId":3,"assigneeEmail":"ahmet@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-14","labels":["Security"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"2b5a607f-3491-4d42-992d-4727457be380","issueKey":"ADPY-3","title":"2.Hafta / Auth ve Login","description":null,"type":"STORY","status":"DONE","priority":"MEDIUM","assigneeName":"Ahmet Mehmet","assigneeId":3,"assigneeEmail":"ahmet@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-22","labels":["Auth"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"490ff33a-98a2-4165-9615-773218c72e45","issueKey":"ADPY-23","title":"Validasyon ve doğrulama hataları","description":null,"type":"BUG","status":"IN_PROGRESS","priority":"MEDIUM","assigneeName":null,"assigneeId":null,"assigneeEmail":null,"projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-05-18","labels":["Security","Auth"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"e55c981b-52f5-4ef9-b6ca-295ee6df3047","issueKey":"ADPY-9","title":"8.Hafta / Çıktı oluşturma Raporlama","description":null,"type":"STORY","status":"IN_REVIEW","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-15","labels":["UI","Core"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"5e5a37e2-bf38-4f4d-8cf1-4bcaa558353d","issueKey":"ADPY-11","title":"10.Hafta / JUnit ile test senaryoları","description":null,"type":"STORY","status":"TODO","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":null,"labels":["Test"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"c7073492-4cf1-4bf0-8495-708d46f240a4","issueKey":"ADPY-2","title":"1.Hafta / Temel Kurulumlar","description":null,"type":"TASK","status":"DONE","priority":"LOW","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-03-11","labels":["Core"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"8cc51519-510c-49f3-ac82-59a4d07f0b6d","issueKey":"ADPY-10","title":"9.Hafta / Yapay Zeka Entegrasyonu","description":null,"type":"STORY","status":"IN_REVIEW","priority":"HIGH","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-04-16","labels":["AI","Security","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"c0ba4532-7348-4775-a1da-9409aea2cd50","issueKey":"ADPY-1","title":"Login - Auth","description":null,"type":"EPIC","status":"IN_PROGRESS","priority":"MEDIUM","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-05-22","labels":["Auth","Security"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null},{"id":"7fa5dbb7-db0a-4bfb-8848-12509746cbcd","issueKey":"ADPY-12","title":"Genel Uygulama Özellikleri","description":null,"type":"EPIC","status":"IN_PROGRESS","priority":"HIGH","assigneeName":"Erdal Akyuz","assigneeId":1,"assigneeEmail":"erdalakyuz33@gmail.com","projectKey":null,"projectId":null,"epicKey":null,"epicId":null,"parentKey":null,"parentId":null,"startDate":null,"endDate":"2026-05-22","labels":["Core","UI"],"createdAt":null,"updatedAt":null,"position":null,"aiAssignmentReason":null}]	[{"id":"861c6a0a-f2a8-4cb8-bcd4-f775592555c9","content":"l","senderEmail":"erdalakyuz33@gmail.com","senderFirstName":"Erdal","senderLastName":"Akyuz","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-05-11T14:25:24.211563","updatedAt":null},{"id":"1f47cd4f-aa22-4721-9e71-692ced96e43b","content":"Shared a file: ADPY_Report.pdf","senderEmail":"erdalakyuz33@gmail.com","senderFirstName":"Erdal","senderLastName":"Akyuz","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"bce5c83f-3a0b-4c86-8309-ec61f834d862","fileName":"ADPY_Report.pdf","fileType":"application/pdf","fileSize":15181,"downloadUrl":"/api/chat/files/bce5c83f-3a0b-4c86-8309-ec61f834d862/download","createdAt":"2026-05-04T14:05:50.668637","messageId":"1f47cd4f-aa22-4721-9e71-692ced96e43b"}],"createdAt":"2026-05-04T14:05:50.665947","updatedAt":"2026-05-04T14:05:50.671615"},{"id":"dd81a827-c5a0-45c0-8d37-28f2cd0151df","content":"Shared a file: Proje_Oneri_Erdal_Akyuz.docx","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"b749d095-920c-4044-9bcb-4ff642d4bf12","fileName":"Proje_Oneri_Erdal_Akyuz.docx","fileType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","fileSize":74691,"downloadUrl":"/api/chat/files/b749d095-920c-4044-9bcb-4ff642d4bf12/download","createdAt":"2026-04-20T13:43:09.253651","messageId":"dd81a827-c5a0-45c0-8d37-28f2cd0151df"}],"createdAt":"2026-04-20T13:43:09.250417","updatedAt":"2026-04-20T13:43:09.259735"},{"id":"19724cba-f074-4cfa-8cbc-931d402ebdfa","content":"Shared a file: pexels-visit-greenland-108649-360912.jpg","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"39147cd5-138e-43ef-905d-2b4186fbe092","fileName":"pexels-visit-greenland-108649-360912.jpg","fileType":"image/jpeg","fileSize":1055582,"downloadUrl":"/api/chat/files/39147cd5-138e-43ef-905d-2b4186fbe092/download","createdAt":"2026-04-20T13:42:45.439904","messageId":"19724cba-f074-4cfa-8cbc-931d402ebdfa"}],"createdAt":"2026-04-20T13:42:45.435974","updatedAt":"2026-04-20T13:42:45.451678"},{"id":"e71f26f8-f05a-4978-92d8-ffa49588c9de","content":"Shared a file: pexels-therato-1933239.jpg","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"FILE","recipientEmail":null,"attachments":[{"id":"c8fb352e-f13f-41d8-84bf-7f06c220fb59","fileName":"pexels-therato-1933239.jpg","fileType":"image/jpeg","fileSize":1197216,"downloadUrl":"/api/chat/files/c8fb352e-f13f-41d8-84bf-7f06c220fb59/download","createdAt":"2026-04-20T13:42:40.414158","messageId":"e71f26f8-f05a-4978-92d8-ffa49588c9de"}],"createdAt":"2026-04-20T13:42:40.406051","updatedAt":"2026-04-20T13:42:40.424097"},{"id":"d1b165de-0bc5-403d-a300-f387c988310a","content":"#[ADPY-6](fb3128a7-aa9f-4c9f-b49f-1729a7ea470a) #[ADPY-4](84d799a8-1801-488a-aaac-3cacd7c209be) #[ADPY-1](c0ba4532-7348-4775-a1da-9409aea2cd50)","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:40:50.611351","updatedAt":"2026-04-20T14:44:12.782901"},{"id":"bcae3ea5-1c7c-4e47-8249-2cb775c0c4f7","content":"#[ADPY-1](c0ba4532-7348-4775-a1da-9409aea2cd50)  #[ADPY-5](889b4a5a-0dde-4399-bac6-bb81b99487b6) \\n\\nIssue etiketleme\\n","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:40:31.554918","updatedAt":"2026-04-20T14:43:54.90945"},{"id":"c4bbfbc8-80f0-4be6-9329-0006372cd2cc","content":"@[Erdal Akyuz](1) Mention deneme","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:39:58.484879","updatedAt":null},{"id":"d5379240-3287-4880-9430-c036a26aab58","content":"Deneme","senderEmail":"ahmet@gmail.com","senderFirstName":"Ahmet","senderLastName":"Mehmet","messageType":"TEXT","recipientEmail":null,"attachments":[],"createdAt":"2026-04-20T13:39:50.214642","updatedAt":null}]
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (project_key, created_at, updated_at, id, name, description, creator_email, version, next_issue_number) FROM stdin;
DEMO	2026-03-23 00:58:32.996285	2026-03-23 00:58:32.996285	7f06b698-7674-40fa-9421-ee82cbf3d7b4	Demo Project 1	Proje hakkinda kisa bilgi . . . 	erdalakyuz33@gmail.com	\N	1
AHMT	2026-03-23 01:02:22.496943	2026-03-23 01:02:22.496943	3db63a40-2599-4fac-b37c-267748ecc4cf	Ahmet's Project	Demo project managed by Ahmet	ahmet@gmail.com	\N	1
EDPP	2026-03-23 12:13:41.379261	2026-03-23 14:00:50.141075	1b40e4d8-f7dd-42e2-b3e7-75a7f4eb87fe	Erdal's Demo Project	Demo Project erdalakyuz@gmail.comDDD	erdalakyuz@gmail.com	1	1
ADPY	2026-04-13 12:29:57.701073	2026-05-11 13:50:11.006367	8a2725d1-162a-4fb9-ba46-6d49008acb28	AI Destekli Proje Yönetim Sistemi	Karmaşık proje yönetim araçlarının hiyerarşik görev yapısını minimalist bir arayüzle sunması ve Google Gemini API kullanarak görev içi sohbetlerinden durum özetleri üretebilmesidir. Sistem; Spring Boot, React ve PostgreSQL ile geliştirilecektir. Rol Tabanlı Erişim Kontrolü  ve anlık form doğrulaması ile veri bütünlüğü sağlanacaktır. Proje, küçük ekipler için öğrenmesi kolay, güvenli ve yapay zeka destekli yenilikçi bir alternatif oluşturmayı hedeflemektedir.	erdalakyuz33@gmail.com	23	24
APPP	2026-03-23 14:11:02.262118	2026-04-12 23:47:39.153253	964d95ab-5cda-4e1e-a6e7-6479735f6ba5	Ahmetin projesi	kisa aciklama	ahmet@gmail.com	8	9
FDSA	2026-05-04 15:18:23.888622	2026-05-04 15:18:33.453415	b1fc2f05-9905-4780-adf0-298c114491e3	432432	<p>43243242</p>	fdsafdsa@gmail.co	1	2
IPLC	2026-05-04 15:34:58.76065	2026-05-04 15:35:44.601696	6d50473b-5f6f-4dc8-9182-a25277dcaaa0	Ilk Proje	<h1>Ilk Proje</h1><ul><li><p>Aciklama</p></li></ul><ol><li><p>Numarali liste...</p></li></ol><p></p>	Deneme@gmail.com	4	5
TPTE	2026-03-31 20:21:56.571154	2026-03-31 20:25:04.858096	c1d2a606-690b-464d-8cdb-76e5afd4f7e1	Test Project	A project to test the backlog hierarchy and drag-and-drop.	test@example.com	3	4
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, first_name, last_name, password, last_seen_at, skills) FROM stdin;
2	erdalakyuz@gmail.com	Erdal	Akyuz	$2a$10$MPmjllgmEQOyhlJRyuKKje3thb95a2DcxISsQrLC.TcrhSQaGLFwC	\N	\N
4	test@example.com	Test	User	$2a$10$uL7Uck2CXVSVxx0506iRruUj7jY/kLcZR8U18bnkEp2zI.eJnzMei	\N	\N
3	ahmet@gmail.com	Ahmet	Mehmet	$2a$10$usdMLAFEeuJqqAWdLbxBZunsxNfCrtxcGQ1WupfYFefZS0BwS3inm	2026-05-04 15:54:45.061842	\N
5	yenideneme@gmail.com	Yeni	Deneme	$2a$10$RCcsRdkS/J5L643vO3YS.eAtXKdnL2/gVWL/mS/5Rl4ILGUEJZi/S	2026-05-04 13:51:00.000652	\N
7	Deneme@gmail.com	Deneme	Test	$2a$10$Q2gPCXdJ0a9AcqefSezx1.VCX1TfzRKpiThkjgfeZ28Hd8m3CpG1C	2026-05-04 15:44:15.320471	\N
1	erdalakyuz33@gmail.com	Erdal	Akyuz	$2a$10$WaYkT7N/Cr.XJ4HhY9A6fOMAC3ioXQtgL9QMHJ78a9LYYmRVdX4SG	2026-05-11 17:18:13.314398	\N
6	fdsafdsa@gmail.co	dfafasd	fdsafa	$2a$10$klZVogRjUBLjOILjTbUUJOV6ig3106BDOuS.JEVALHGjeYKm9zM9W	2026-05-04 15:19:18.936111	\N
\.


--
-- Name: labels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.labels_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Data for Name: BLOBS; Type: BLOBS; Schema: -; Owner: -
--

BEGIN;

SELECT pg_catalog.lo_open('16933', 131072);
SELECT pg_catalog.lowrite(0, '\x5b7b226964223a2235613165343538372d353366342d343831312d396563622d346362666438356136323735222c2269737375654b6579223a22414450592d38222c227469746c65223a22372e4861667461202f2043616e6cc4b120536f68626574222c226465736372697074696f6e223a6e756c6c2c2274797065223a2253544f5259222c22737461747573223a22444f4e45222c227072696f72697479223a2248494748222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30342d3230222c226c6162656c73223a5b22436f7265222c225549225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2238303332613334322d363130632d343237382d613439642d396637346565383962336164222c2269737375654b6579223a22414450592d37222c227469746c65223a22362e4861667461202f204b616e62616e2053c3bc72c3bc6b6c65202d2042c4b172616b20c3967a656c6c69c49f6920222c226465736372697074696f6e223a6e756c6c2c2274797065223a2253544f5259222c22737461747573223a22444f4e45222c227072696f72697479223a224c4f57222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30342d3135222c226c6162656c73223a5b225549225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2266623331323861372d616139662d346339662d623439662d313732396137656134373061222c2269737375654b6579223a22414450592d36222c227469746c65223a22352e4861667461202f204261636b6c6f672076652046696c7472656c656d65222c226465736372697074696f6e223a6e756c6c2c2274797065223a2253544f5259222c22737461747573223a22444f4e45222c227072696f72697479223a224d454449554d222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30342d3135222c226c6162656c73223a5b22436f7265222c225549225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2265353563393831622d353266352d346566392d623663612d323935656536646633303437222c2269737375654b6579223a22414450592d39222c227469746c65223a22382e4861667461202f20c387c4b16b74c4b1206f6c75c59f7475726d61205261706f726c616d61222c226465736372697074696f6e223a6e756c6c2c2274797065223a2253544f5259222c22737461747573223a22494e5f50524f4752455353222c227072696f72697479223a224d454449554d222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30342d3135222c226c6162656c73223a5b225549222c22436f7265225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2238383962346135612d306464652d343339392d626163362d626238316239393438376236222c2269737375654b6579223a22414450592d35222c227469746c65223a22342e4861667461202f204372756420c3967a656c6c696b6c657269222c226465736372697074696f6e223a6e756c6c2c2274797065223a225441534b222c22737461747573223a22444f4e45222c227072696f72697479223a224d454449554d222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30342d3037222c226c6162656c73223a5b22436f7265225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2238346437393961382d313830312d343838612d616161632d336361636437633230396265222c2269737375654b6579223a22414450592d34222c227469746c65223a22332e4861667461202f2056616c69646174696f6e222c226465736372697074696f6e223a6e756c6c2c2274797065223a225441534b222c22737461747573223a22444f4e45222c227072696f72697479223a2248494748222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30342d3134222c226c6162656c73223a5b225365637572697479225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2232623561363037662d333439312d346434322d393932642d343732373435376265333830222c2269737375654b6579223a22414450592d33222c227469746c65223a22322e4861667461202f2041757468207665204c6f67696e222c226465736372697074696f6e223a6e756c6c2c2274797065223a2253544f5259222c22737461747573223a22444f4e45222c227072696f72697479223a224d454449554d222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30342d3232222c226c6162656c73223a5b2241757468225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2238636335313531392d353130632d343966332d616338322d353961346430376630623664222c2269737375654b6579223a22414450592d3130222c227469746c65223a22392e4861667461202f205961706179205a656b6120456e746567726173796f6e75222c226465736372697074696f6e223a6e756c6c2c2274797065223a2253544f5259222c22737461747573223a22494e5f50524f4752455353222c227072696f72697479223a2248494748222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30342d3136222c226c6162656c73223a5b224149222c225365637572697479222c225549225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2235653561333765322d626633382d346634642d386366312d346263616135353833353364222c2269737375654b6579223a22414450592d3131222c227469746c65223a2231302e4861667461202f204a556e697420696c6520746573742073656e6172796f6c6172c4b1222c226465736372697074696f6e223a6e756c6c2c2274797065223a2253544f5259222c22737461747573223a22544f444f222c227072696f72697479223a224c4f57222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a6e756c6c2c226c6162656c73223a5b2254657374225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2263373037333439322d346366312d346266302d383439352d373038643436663234306134222c2269737375654b6579223a22414450592d32222c227469746c65223a22312e4861667461202f2054656d656c204b7572756c756d6c6172222c226465736372697074696f6e223a6e756c6c2c2274797065223a225441534b222c22737461747573223a22444f4e45222c227072696f72697479223a224c4f57222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30332d3131222c226c6162656c73223a5b22436f7265225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2263306261343533322d373334382d343737352d613164612d393430396165613263643530222c2269737375654b6579223a22414450592d31222c227469746c65223a224c6f67696e202d2041757468222c226465736372697074696f6e223a6e756c6c2c2274797065223a2245504943222c22737461747573223a22494e5f50524f4752455353222c227072696f72697479223a224d454449554d222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30352d3232222c226c6162656c73223a5b2241757468222c225365637572697479225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d2c7b226964223a2237666135646262372d646230612d346266622d383834382d313235303937343663626364222c2269737375654b6579223a22414450592d3132222c227469746c65223a2247656e656c20557967756c616d6120c3967a656c6c696b6c657269222c226465736372697074696f6e223a6e756c6c2c2274797065223a2245504943222c22737461747573223a22494e5f50524f4752455353222c227072696f72697479223a2248494748222c2261737369676e65654e616d65223a22457264616c20416b79757a222c2261737369676e65654964223a6e756c6c2c2261737369676e6565456d61696c223a6e756c6c2c2270726f6a6563744b6579223a6e756c6c2c2270726f6a6563744964223a6e756c6c2c22657069634b6579223a6e756c6c2c22657069634964223a6e756c6c2c22706172656e744b6579223a6e756c6c2c22706172656e744964223a6e756c6c2c22737461727444617465223a6e756c6c2c22656e6444617465223a22323032362d30352d3232222c226c6162656c73223a5b22436f7265222c225549225d2c22637265617465644174223a6e756c6c2c22757064617465644174223a6e756c6c2c22706f736974696f6e223a6e756c6c2c22616941737369676e6d656e74526561736f6e223a6e756c6c7d5d');
SELECT pg_catalog.lo_close(0);

SELECT pg_catalog.lo_open('16934', 131072);
SELECT pg_catalog.lowrite(0, '\x5b7b226964223a2231663437636434662d616132322d343732312d396537312d363932636564393665343362222c22636f6e74656e74223a2253686172656420612066696c653a20414450595f5265706f72742e706466222c2273656e646572456d61696c223a22657264616c616b79757a333340676d61696c2e636f6d222c2273656e64657246697273744e616d65223a22457264616c222c2273656e6465724c6173744e616d65223a22416b79757a222c226d65737361676554797065223a2246494c45222c22726563697069656e74456d61696c223a6e756c6c2c226174746163686d656e7473223a5b7b226964223a2262636535633833662d336130622d346338362d383330392d656336316638333464383632222c2266696c654e616d65223a22414450595f5265706f72742e706466222c2266696c6554797065223a226170706c69636174696f6e2f706466222c2266696c6553697a65223a31353138312c22646f776e6c6f616455726c223a222f6170692f636861742f66696c65732f62636535633833662d336130622d346338362d383330392d6563363166383334643836322f646f776e6c6f6164222c22637265617465644174223a22323032362d30352d30345431343a30353a35302e363638363337222c226d6573736167654964223a2231663437636434662d616132322d343732312d396537312d363932636564393665343362227d5d2c22637265617465644174223a22323032362d30352d30345431343a30353a35302e363635393437222c22757064617465644174223a22323032362d30352d30345431343a30353a35302e363731363135227d2c7b226964223a2264643831613832372d633561302d343563302d386433372d323866326364303135316466222c22636f6e74656e74223a2253686172656420612066696c653a2050726f6a655f4f6e6572695f457264616c5f416b79757a2e646f6378222c2273656e646572456d61696c223a2261686d657440676d61696c2e636f6d222c2273656e64657246697273744e616d65223a2241686d6574222c2273656e6465724c6173744e616d65223a224d65686d6574222c226d65737361676554797065223a2246494c45222c22726563697069656e74456d61696c223a6e756c6c2c226174746163686d656e7473223a5b7b226964223a2262373439643039352d393230632d343034342d396263622d346666363432643462663132222c2266696c654e616d65223a2250726f6a655f4f6e6572695f457264616c5f416b79757a2e646f6378222c2266696c6554797065223a226170706c69636174696f6e2f766e642e6f70656e786d6c666f726d6174732d6f6666696365646f63756d656e742e776f726470726f63657373696e676d6c2e646f63756d656e74222c2266696c6553697a65223a37343639312c22646f776e6c6f616455726c223a222f6170692f636861742f66696c65732f62373439643039352d393230632d343034342d396263622d3466663634326434626631322f646f776e6c6f6164222c22637265617465644174223a22323032362d30342d32305431333a34333a30392e323533363531222c226d6573736167654964223a2264643831613832372d633561302d343563302d386433372d323866326364303135316466227d5d2c22637265617465644174223a22323032362d30342d32305431333a34333a30392e323530343137222c22757064617465644174223a22323032362d30342d32305431333a34333a30392e323539373335227d2c7b226964223a2231393732346362612d663037342d346366612d386362632d393331643430326562646661222c22636f6e74656e74223a2253686172656420612066696c653a20706578656c732d76697369742d677265656e6c616e642d3130383634392d3336303931322e6a7067222c2273656e646572456d61696c223a2261686d657440676d61696c2e636f6d222c2273656e64657246697273744e616d65223a2241686d6574222c2273656e6465724c6173744e616d65223a224d65686d6574222c226d65737361676554797065223a2246494c45222c22726563697069656e74456d61696c223a6e756c6c2c226174746163686d656e7473223a5b7b226964223a2233393134376364352d313338652d343365662d393035642d326234313836666265303932222c2266696c654e616d65223a22706578656c732d76697369742d677265656e6c616e642d3130383634392d3336303931322e6a7067222c2266696c6554797065223a22696d6167652f6a706567222c2266696c6553697a65223a313035353538322c22646f776e6c6f616455726c223a222f6170692f636861742f66696c65732f33393134376364352d313338652d343365662d393035642d3262343138366662653039322f646f776e6c6f6164222c22637265617465644174223a22323032362d30342d32305431333a34323a34352e343339393034222c226d6573736167654964223a2231393732346362612d663037342d346366612d386362632d393331643430326562646661227d5d2c22637265617465644174223a22323032362d30342d32305431333a34323a34352e343335393734222c22757064617465644174223a22323032362d30342d32305431333a34323a34352e343531363738227d2c7b226964223a2265373166323666382d663035612d343937382d393264382d666661343935383863396465222c22636f6e74656e74223a2253686172656420612066696c653a20706578656c732d7468657261746f2d313933333233392e6a7067222c2273656e646572456d61696c223a2261686d657440676d61696c2e636f6d222c2273656e64657246697273744e616d65223a2241686d6574222c2273656e6465724c6173744e616d65223a224d65686d6574222c226d65737361676554797065223a2246494c45222c22726563697069656e74456d61696c223a6e756c6c2c226174746163686d656e7473223a5b7b226964223a2263386662333532652d663133662d343164382d383462662d376630366332323066623539222c2266696c654e616d65223a22706578656c732d7468657261746f2d313933333233392e6a7067222c2266696c6554797065223a22696d6167652f6a706567222c2266696c6553697a65223a313139373231362c22646f776e6c6f616455726c223a222f6170692f636861742f66696c65732f63386662333532652d663133662d343164382d383462662d3766303663323230666235392f646f776e6c6f6164222c22637265617465644174223a22323032362d30342d32305431333a34323a34302e343134313538222c226d6573736167654964223a2265373166323666382d663035612d343937382d393264382d666661343935383863396465227d5d2c22637265617465644174223a22323032362d30342d32305431333a34323a34302e343036303531222c22757064617465644174223a22323032362d30342d32305431333a34323a34302e343234303937227d2c7b226964223a2264316231363564652d306263352d343033642d613330302d663338376339383833313061222c22636f6e74656e74223a22235b414450592d365d2866623331323861372d616139662d346339662d623439662d3137323961376561343730612920235b414450592d345d2838346437393961382d313830312d343838612d616161632d3363616364376332303962652920235b414450592d315d2863306261343533322d373334382d343737352d613164612d39343039616561326364353029222c2273656e646572456d61696c223a2261686d657440676d61696c2e636f6d222c2273656e64657246697273744e616d65223a2241686d6574222c2273656e6465724c6173744e616d65223a224d65686d6574222c226d65737361676554797065223a2254455854222c22726563697069656e74456d61696c223a6e756c6c2c226174746163686d656e7473223a5b5d2c22637265617465644174223a22323032362d30342d32305431333a34303a35302e363131333531222c22757064617465644174223a22323032362d30342d32305431343a34343a31322e373832393031227d2c7b226964223a2262636165336561352d316337632d346534372d383234392d326362373735633063346637222c22636f6e74656e74223a22235b414450592d315d2863306261343533322d373334382d343737352d613164612d393430396165613263643530292020235b414450592d355d2838383962346135612d306464652d343339392d626163362d62623831623939343837623629205c6e5c6e4973737565206574696b65746c656d655c6e222c2273656e646572456d61696c223a2261686d657440676d61696c2e636f6d222c2273656e64657246697273744e616d65223a2241686d6574222c2273656e6465724c6173744e616d65223a224d65686d6574222c226d65737361676554797065223a2254455854222c22726563697069656e74456d61696c223a6e756c6c2c226174746163686d656e7473223a5b5d2c22637265617465644174223a22323032362d30342d32305431333a34303a33312e353534393138222c22757064617465644174223a22323032362d30342d32305431343a34333a35342e3930393435227d2c7b226964223a2263346262666263382d383066302d346265362d393332392d303030363337326364326363222c22636f6e74656e74223a22405b457264616c20416b79757a5d283129204d656e74696f6e2064656e656d65222c2273656e646572456d61696c223a2261686d657440676d61696c2e636f6d222c2273656e64657246697273744e616d65223a2241686d6574222c2273656e6465724c6173744e616d65223a224d65686d6574222c226d65737361676554797065223a2254455854222c22726563697069656e74456d61696c223a6e756c6c2c226174746163686d656e7473223a5b5d2c22637265617465644174223a22323032362d30342d32305431333a33393a35382e343834383739222c22757064617465644174223a6e756c6c7d2c7b226964223a2264353337393234302d333238372d343838302d393433302d633033366132366161623538222c22636f6e74656e74223a2244656e656d65222c2273656e646572456d61696c223a2261686d657440676d61696c2e636f6d222c2273656e64657246697273744e616d65223a2241686d6574222c2273656e6465724c6173744e616d65223a224d65686d6574222c226d65737361676554797065223a2254455854222c22726563697069656e74456d61696c223a6e756c6c2c226174746163686d656e7473223a5b5d2c22637265617465644174223a22323032362d30342d32305431333a33393a35302e323134363432222c22757064617465644174223a6e756c6c7d5d');
SELECT pg_catalog.lo_close(0);

COMMIT;

--
-- Name: app_notifications app_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_notifications
    ADD CONSTRAINT app_notifications_pkey PRIMARY KEY (id);


--
-- Name: chat_file_attachments chat_file_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_file_attachments
    ADD CONSTRAINT chat_file_attachments_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_read_receipts chat_read_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_read_receipts
    ADD CONSTRAINT chat_read_receipts_pkey PRIMARY KEY (id);


--
-- Name: chat_read_status chat_read_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_read_status
    ADD CONSTRAINT chat_read_status_pkey PRIMARY KEY (id);


--
-- Name: issue_comments issue_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_comments
    ADD CONSTRAINT issue_comments_pkey PRIMARY KEY (id);


--
-- Name: issue_history issue_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_history
    ADD CONSTRAINT issue_history_pkey PRIMARY KEY (id);


--
-- Name: issues issues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_pkey PRIMARY KEY (id);


--
-- Name: labels labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT labels_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- Name: project_reports project_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_reports
    ADD CONSTRAINT project_reports_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: projects projects_project_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_project_key_key UNIQUE (project_key);


--
-- Name: labels uk4hi15qmpoahhkf646aym2seub; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT uk4hi15qmpoahhkf646aym2seub UNIQUE (name, project_id);


--
-- Name: issues uksqy2j85vopd550spxwa6e5xem; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT uksqy2j85vopd550spxwa6e5xem UNIQUE (issue_key);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: labels fk3sxl6x5sa83ojn87msxofr650; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labels
    ADD CONSTRAINT fk3sxl6x5sa83ojn87msxofr650 FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: issues fk4j2x3reshuu7qj5svh6eacnpt; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT fk4j2x3reshuu7qj5svh6eacnpt FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: issue_history fk52es99ukn41u48nkj7x8k91qd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_history
    ADD CONSTRAINT fk52es99ukn41u48nkj7x8k91qd FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: chat_messages fk6f0y4l43ihmgfswkgy9yrtjkh; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk6f0y4l43ihmgfswkgy9yrtjkh FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: issues fk6tkde1c2odhrtreahor01p5fb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT fk6tkde1c2odhrtreahor01p5fb FOREIGN KEY (assignee_id) REFERENCES public.users(id);


--
-- Name: chat_messages fk9cy5qdbo924k3jflvj0y04s6y; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk9cy5qdbo924k3jflvj0y04s6y FOREIGN KEY (recipient_id) REFERENCES public.users(id);


--
-- Name: issues fkaxw1cvm6o4r7vdednj01v82x6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT fkaxw1cvm6o4r7vdednj01v82x6 FOREIGN KEY (parent_id) REFERENCES public.issues(id);


--
-- Name: chat_read_receipts fkcskmyxxex3midim34mwqap5ng; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_read_receipts
    ADD CONSTRAINT fkcskmyxxex3midim34mwqap5ng FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: project_reports fkdfdw9c7sf8fjfvg366gxvl29t; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_reports
    ADD CONSTRAINT fkdfdw9c7sf8fjfvg366gxvl29t FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_members fkdki1sp2homqsdcvqm9yrix31g; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT fkdki1sp2homqsdcvqm9yrix31g FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: issue_labels fkfskpaxuixega1rlf9hrhnhngs; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_labels
    ADD CONSTRAINT fkfskpaxuixega1rlf9hrhnhngs FOREIGN KEY (issue_id) REFERENCES public.issues(id);


--
-- Name: project_members fkgul2el0qjk5lsvig3wgajwm77; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT fkgul2el0qjk5lsvig3wgajwm77 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: issue_history fkgyteaxmn2jl5x486e74awj6fe; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_history
    ADD CONSTRAINT fkgyteaxmn2jl5x486e74awj6fe FOREIGN KEY (issue_id) REFERENCES public.issues(id);


--
-- Name: chat_read_receipts fkhdpohqgv30yfw5ghq8ych4nti; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_read_receipts
    ADD CONSTRAINT fkhdpohqgv30yfw5ghq8ych4nti FOREIGN KEY (last_read_message_id) REFERENCES public.chat_messages(id);


--
-- Name: issues fkkbt0hye1pnracb2cjla6e61ir; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT fkkbt0hye1pnracb2cjla6e61ir FOREIGN KEY (epic_id) REFERENCES public.issues(id);


--
-- Name: chat_read_receipts fkkehv7qqtgahy2a4kpwmwh5loy; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_read_receipts
    ADD CONSTRAINT fkkehv7qqtgahy2a4kpwmwh5loy FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: app_notifications fkmei6utbvk0mt6mkqo1q9gg6pn; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_notifications
    ADD CONSTRAINT fkmei6utbvk0mt6mkqo1q9gg6pn FOREIGN KEY (recipient_id) REFERENCES public.users(id);


--
-- Name: issue_comments fknvnj0204928o0w1th5jsx4f28; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_comments
    ADD CONSTRAINT fknvnj0204928o0w1th5jsx4f28 FOREIGN KEY (issue_id) REFERENCES public.issues(id);


--
-- Name: chat_messages fkp9abl798sxk8na4uw32wnue8h; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fkp9abl798sxk8na4uw32wnue8h FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: chat_read_status fkqrj508rpl4k59r3a4acg7e3t4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_read_status
    ADD CONSTRAINT fkqrj508rpl4k59r3a4acg7e3t4 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: issue_comments fksk4ddtj3qrml8h1n8ty33mck5; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_comments
    ADD CONSTRAINT fksk4ddtj3qrml8h1n8ty33mck5 FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: chat_file_attachments fkw3hs9yyjmc62p3iy212fvwqe; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_file_attachments
    ADD CONSTRAINT fkw3hs9yyjmc62p3iy212fvwqe FOREIGN KEY (chat_message_id) REFERENCES public.chat_messages(id);


--
-- Name: project_reports fkw6sfi6jtq9lekoep1xjbehry; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_reports
    ADD CONSTRAINT fkw6sfi6jtq9lekoep1xjbehry FOREIGN KEY (generated_by_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict ujBtqgpmsNhR1zBBBGyojXD7sslF4wQUeWKGmevBUZKzsv7b9FbPX53ivD8Dedr

