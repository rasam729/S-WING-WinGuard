--
-- PostgreSQL database dump
--

\restrict EkFBvjgtmoOn6zIe5JxVqexL27yS65qG671qhm3p31Agve4ejVR5OVBe7V01Jku

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-11 15:35:13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5967 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 861 (class 1255 OID 24580)
-- Name: triage_report(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.triage_report() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.category = 'Pothole' THEN
        NEW.dept_id := (SELECT dept_id FROM public.departments WHERE dept_name = 'Public Works Department');
    ELSIF NEW.category = 'Streetlight' OR NEW.category = 'Dark Alley' THEN
        NEW.dept_id := (SELECT dept_id FROM public.departments WHERE dept_name = 'Electrical & Lighting');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.triage_report() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 17516)
-- Name: budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgets (
    budget_id integer NOT NULL,
    report_id integer,
    sanctioned_amount numeric(12,2),
    spent_amount numeric(12,2),
    funding_source text
);


ALTER TABLE public.budgets OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17515)
-- Name: budgets_budget_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budgets_budget_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budgets_budget_id_seq OWNER TO postgres;

--
-- TOC entry 5968 (class 0 OID 0)
-- Dependencies: 227
-- Name: budgets_budget_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budgets_budget_id_seq OWNED BY public.budgets.budget_id;


--
-- TOC entry 230 (class 1259 OID 24583)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    dept_id integer NOT NULL,
    dept_name character varying(100) NOT NULL,
    executive_engineer character varying(100),
    contact_email character varying(100)
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 24582)
-- Name: departments_dept_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_dept_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_dept_id_seq OWNER TO postgres;

--
-- TOC entry 5969 (class 0 OID 0)
-- Dependencies: 229
-- Name: departments_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_dept_id_seq OWNED BY public.departments.dept_id;


--
-- TOC entry 226 (class 1259 OID 17499)
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    report_id integer NOT NULL,
    category text,
    severity integer,
    description text,
    report_status text DEFAULT 'Received'::text,
    location public.geography(Point,4326),
    dept_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'Report Received'::character varying,
    amount_sanctioned numeric(12,2) DEFAULT 0.00,
    amount_spent numeric(12,2) DEFAULT 0.00
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 24592)
-- Name: map_dashboard_data; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.map_dashboard_data AS
 SELECT report_id,
    category,
    status,
    amount_sanctioned,
    public.st_x((location)::public.geometry) AS longitude,
    public.st_y((location)::public.geometry) AS latitude
   FROM public.reports;


ALTER VIEW public.map_dashboard_data OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17498)
-- Name: reports_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_report_id_seq OWNER TO postgres;

--
-- TOC entry 5970 (class 0 OID 0)
-- Dependencies: 225
-- Name: reports_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_report_id_seq OWNED BY public.reports.report_id;


--
-- TOC entry 5790 (class 2604 OID 17519)
-- Name: budgets budget_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets ALTER COLUMN budget_id SET DEFAULT nextval('public.budgets_budget_id_seq'::regclass);


--
-- TOC entry 5791 (class 2604 OID 24586)
-- Name: departments dept_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN dept_id SET DEFAULT nextval('public.departments_dept_id_seq'::regclass);


--
-- TOC entry 5784 (class 2604 OID 17502)
-- Name: reports report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN report_id SET DEFAULT nextval('public.reports_report_id_seq'::regclass);


--
-- TOC entry 5959 (class 0 OID 17516)
-- Dependencies: 228
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budgets (budget_id, report_id, sanctioned_amount, spent_amount, funding_source) FROM stdin;
\.


--
-- TOC entry 5961 (class 0 OID 24583)
-- Dependencies: 230
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (dept_id, dept_name, executive_engineer, contact_email) FROM stdin;
1	Public Works Department	Er. Rajesh Kumar	\N
2	Electrical & Lighting	Er. Sneha Rao	\N
\.


--
-- TOC entry 5957 (class 0 OID 17499)
-- Dependencies: 226
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (report_id, category, severity, description, report_status, location, dept_id, created_at, status, amount_sanctioned, amount_spent) FROM stdin;
3	Pothole	5	\N	Received	0101000020E610000000000000004053400000000000002940	1	2026-05-03 13:09:56.643837	Report Received	0.00	0.00
4	Pothole	5	\N	Received	0101000020E610000000000000004053400000000000002940	1	2026-05-03 13:10:00.905439	Report Received	0.00	0.00
5	Pothole	5	\N	Received	0101000020E610000000000000006053400000000000002940	1	2026-05-03 13:56:00.921497	Report Received	0.00	0.00
7	Pothole	\N	\N	Received	0101000020E6100000F6285C8FC2655340713D0AD7A3F02940	1	2026-05-11 15:14:39.525106	Report Received	0.00	0.00
\.


--
-- TOC entry 5783 (class 0 OID 16708)
-- Dependencies: 221
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 5971 (class 0 OID 0)
-- Dependencies: 227
-- Name: budgets_budget_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budgets_budget_id_seq', 1, false);


--
-- TOC entry 5972 (class 0 OID 0)
-- Dependencies: 229
-- Name: departments_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_dept_id_seq', 2, true);


--
-- TOC entry 5973 (class 0 OID 0)
-- Dependencies: 225
-- Name: reports_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_report_id_seq', 7, true);


--
-- TOC entry 5798 (class 2606 OID 17524)
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (budget_id);


--
-- TOC entry 5800 (class 2606 OID 24590)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (dept_id);


--
-- TOC entry 5796 (class 2606 OID 17509)
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (report_id);


--
-- TOC entry 5802 (class 2620 OID 24591)
-- Name: reports trigger_triage; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_triage BEFORE INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.triage_report();


--
-- TOC entry 5801 (class 2606 OID 17525)
-- Name: budgets budgets_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(report_id);


-- Completed on 2026-05-11 15:35:13

--
-- PostgreSQL database dump complete
--

\unrestrict EkFBvjgtmoOn6zIe5JxVqexL27yS65qG671qhm3p31Agve4ejVR5OVBe7V01Jku

