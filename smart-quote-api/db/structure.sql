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

--
-- Name: next_quote_seq(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.next_quote_seq(p_year integer) RETURNS integer
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_seq INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('quote_seq_' || p_year));

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(reference_no, '-', 3) AS INT)
  ), 0) + 1
  INTO v_seq
  FROM quotes
  WHERE reference_no LIKE 'SQ-' || p_year || '-%'
    AND reference_no ~ '^SQ-[0-9]{4}-[0-9]+$';

  RETURN v_seq;
END;
$_$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addon_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addon_rates (
    id bigint NOT NULL,
    code character varying(20) NOT NULL,
    carrier character varying(10) NOT NULL,
    name_en character varying(100) NOT NULL,
    name_ko character varying(100) NOT NULL,
    description text,
    charge_type character varying(20) NOT NULL,
    unit character varying(20) NOT NULL,
    amount numeric(12,2) DEFAULT 0.0 NOT NULL,
    per_kg_rate numeric(10,2),
    rate_percent numeric(8,4),
    min_amount numeric(12,2),
    fsc_applicable boolean DEFAULT false NOT NULL,
    auto_detect boolean DEFAULT false NOT NULL,
    selectable boolean DEFAULT true NOT NULL,
    condition character varying(20),
    detect_rules jsonb,
    effective_from date DEFAULT CURRENT_DATE NOT NULL,
    effective_to date,
    is_active boolean DEFAULT true NOT NULL,
    source_url character varying,
    created_by character varying,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: addon_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.addon_rates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: addon_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.addon_rates_id_seq OWNED BY public.addon_rates.id;


--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_id bigint,
    action character varying NOT NULL,
    resource_type character varying NOT NULL,
    resource_id bigint,
    resource_ref character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id bigint NOT NULL,
    company_name character varying NOT NULL,
    contact_name character varying,
    email character varying,
    phone character varying,
    country character varying DEFAULT 'KR'::character varying,
    address character varying,
    notes text,
    user_id bigint,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: discount_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_rules (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    rule_type character varying(20) DEFAULT 'weight_based'::character varying NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    match_email character varying(255),
    match_nationality character varying(100),
    weight_min numeric(10,2),
    weight_max numeric(10,2),
    discount_percent numeric(5,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: discount_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: discount_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_rules_id_seq OWNED BY public.discount_rules.id;


--
-- Name: fsc_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fsc_rates (
    id bigint NOT NULL,
    carrier character varying NOT NULL,
    international numeric(5,2) DEFAULT 0.0 NOT NULL,
    domestic numeric(5,2) DEFAULT 0.0 NOT NULL,
    source character varying DEFAULT 'manual'::character varying,
    updated_by character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: fsc_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fsc_rates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fsc_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fsc_rates_id_seq OWNED BY public.fsc_rates.id;


--
-- Name: magic_link_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.magic_link_tokens (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token_digest character varying NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    used_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: magic_link_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.magic_link_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: magic_link_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.magic_link_tokens_id_seq OWNED BY public.magic_link_tokens.id;


--
-- Name: quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotes (
    id bigint NOT NULL,
    reference_no character varying(20) NOT NULL,
    origin_country character varying(3) DEFAULT 'KR'::character varying NOT NULL,
    destination_country character varying(3) NOT NULL,
    destination_zip character varying(20),
    domestic_region_code character varying(1) DEFAULT 'A'::character varying NOT NULL,
    is_jeju_pickup boolean DEFAULT false,
    incoterm character varying(5) NOT NULL,
    packing_type character varying(20) DEFAULT 'NONE'::character varying NOT NULL,
    shipping_item_type character varying(20) DEFAULT 'NON_DOCUMENT'::character varying NOT NULL,
    discount_percent numeric(5,2) NOT NULL,
    duty_tax_estimate numeric(12,0) DEFAULT 0.0,
    exchange_rate numeric(10,2) NOT NULL,
    fsc_percent numeric(5,2) NOT NULL,
    manual_domestic_cost numeric(12,0),
    manual_packing_cost numeric(12,0),
    items jsonb NOT NULL,
    total_quote_amount numeric(15,0) NOT NULL,
    total_quote_amount_usd numeric(12,2) NOT NULL,
    total_cost_amount numeric(15,0) NOT NULL,
    discount_amount numeric(15,0) NOT NULL,
    applied_discount_percent numeric(5,2) NOT NULL,
    billable_weight numeric(10,2) NOT NULL,
    applied_zone character varying(50),
    domestic_truck_type character varying(50),
    breakdown jsonb NOT NULL,
    warnings jsonb DEFAULT '[]'::jsonb,
    status character varying(20) DEFAULT 'draft'::character varying,
    notes text,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id bigint,
    customer_id bigint,
    pickup_in_seoul_cost numeric(12,0) DEFAULT 0.0 NOT NULL,
    manual_surge_cost numeric(12,0) DEFAULT 0.0 NOT NULL,
    overseas_carrier character varying(10) DEFAULT 'UPS'::character varying NOT NULL,
    carrier character varying(10),
    transit_time character varying(50),
    validity_date date,
    share_token character varying,
    share_expires_at timestamp(6) without time zone
);


--
-- Name: quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quotes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quotes_id_seq OWNED BY public.quotes.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: surcharges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.surcharges (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    name_ko character varying(100),
    description text,
    carrier character varying(10),
    zone character varying(10),
    country_codes character varying DEFAULT ''::character varying,
    charge_type character varying DEFAULT 'fixed'::character varying NOT NULL,
    amount numeric(12,2) DEFAULT 0.0 NOT NULL,
    effective_from date DEFAULT CURRENT_DATE NOT NULL,
    effective_to date,
    is_active boolean DEFAULT true NOT NULL,
    source_url character varying,
    created_by character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: surcharges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.surcharges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: surcharges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.surcharges_id_seq OWNED BY public.surcharges.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying NOT NULL,
    password_digest character varying NOT NULL,
    name character varying(100),
    company character varying(200),
    nationality character varying(100),
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    networks jsonb DEFAULT '[]'::jsonb,
    magic_link_token character varying,
    magic_link_token_expires_at timestamp(6) without time zone,
    magic_link_token_digest character varying,
    refresh_token_jti character varying
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: addon_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addon_rates ALTER COLUMN id SET DEFAULT nextval('public.addon_rates_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: discount_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rules ALTER COLUMN id SET DEFAULT nextval('public.discount_rules_id_seq'::regclass);


--
-- Name: fsc_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fsc_rates ALTER COLUMN id SET DEFAULT nextval('public.fsc_rates_id_seq'::regclass);


--
-- Name: magic_link_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.magic_link_tokens ALTER COLUMN id SET DEFAULT nextval('public.magic_link_tokens_id_seq'::regclass);


--
-- Name: quotes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes ALTER COLUMN id SET DEFAULT nextval('public.quotes_id_seq'::regclass);


--
-- Name: surcharges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surcharges ALTER COLUMN id SET DEFAULT nextval('public.surcharges_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: addon_rates addon_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addon_rates
    ADD CONSTRAINT addon_rates_pkey PRIMARY KEY (id);


--
-- Name: ar_internal_metadata ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: discount_rules discount_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_rules
    ADD CONSTRAINT discount_rules_pkey PRIMARY KEY (id);


--
-- Name: fsc_rates fsc_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fsc_rates
    ADD CONSTRAINT fsc_rates_pkey PRIMARY KEY (id);


--
-- Name: magic_link_tokens magic_link_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.magic_link_tokens
    ADD CONSTRAINT magic_link_tokens_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: surcharges surcharges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surcharges
    ADD CONSTRAINT surcharges_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_addon_rates_carrier_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addon_rates_carrier_active ON public.addon_rates USING btree (carrier, is_active);


--
-- Name: idx_margin_rules_active_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_rules_active_priority ON public.discount_rules USING btree (is_active, priority DESC);


--
-- Name: idx_margin_rules_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_rules_email ON public.discount_rules USING btree (match_email) WHERE (match_email IS NOT NULL);


--
-- Name: idx_margin_rules_nationality; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_rules_nationality ON public.discount_rules USING btree (match_nationality) WHERE (match_nationality IS NOT NULL);


--
-- Name: idx_quotes_stale_drafts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quotes_stale_drafts ON public.quotes USING btree (validity_date) WHERE ((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('sent'::character varying)::text]));


--
-- Name: idx_quotes_user_status_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quotes_user_status_date ON public.quotes USING btree (user_id, status, created_at);


--
-- Name: idx_surcharges_active_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_surcharges_active_dates ON public.surcharges USING btree (is_active, effective_from, effective_to);


--
-- Name: index_addon_rates_on_carrier_and_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_addon_rates_on_carrier_and_code ON public.addon_rates USING btree (carrier, code);


--
-- Name: index_addon_rates_on_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_addon_rates_on_sort_order ON public.addon_rates USING btree (sort_order);


--
-- Name: index_audit_logs_on_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_audit_logs_on_action ON public.audit_logs USING btree (action);


--
-- Name: index_audit_logs_on_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_audit_logs_on_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: index_audit_logs_on_resource_type_and_resource_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_audit_logs_on_resource_type_and_resource_id ON public.audit_logs USING btree (resource_type, resource_id);


--
-- Name: index_audit_logs_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_audit_logs_on_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: index_customers_on_company_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_customers_on_company_name ON public.customers USING btree (company_name);


--
-- Name: index_customers_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_customers_on_email ON public.customers USING btree (email);


--
-- Name: index_customers_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_customers_on_user_id ON public.customers USING btree (user_id);


--
-- Name: index_fsc_rates_on_carrier; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_fsc_rates_on_carrier ON public.fsc_rates USING btree (carrier);


--
-- Name: index_magic_link_tokens_on_token_digest; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_magic_link_tokens_on_token_digest ON public.magic_link_tokens USING btree (token_digest);


--
-- Name: index_magic_link_tokens_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_magic_link_tokens_on_user_id ON public.magic_link_tokens USING btree (user_id);


--
-- Name: index_quotes_on_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_quotes_on_created_at ON public.quotes USING btree (created_at DESC);


--
-- Name: index_quotes_on_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_quotes_on_customer_id ON public.quotes USING btree (customer_id);


--
-- Name: index_quotes_on_destination_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_quotes_on_destination_country ON public.quotes USING btree (destination_country);


--
-- Name: index_quotes_on_reference_no; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_quotes_on_reference_no ON public.quotes USING btree (reference_no);


--
-- Name: index_quotes_on_share_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_quotes_on_share_token ON public.quotes USING btree (share_token);


--
-- Name: index_quotes_on_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_quotes_on_status ON public.quotes USING btree (status);


--
-- Name: index_quotes_on_status_and_validity_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_quotes_on_status_and_validity_date ON public.quotes USING btree (status, validity_date);


--
-- Name: index_quotes_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_quotes_on_user_id ON public.quotes USING btree (user_id);


--
-- Name: index_quotes_on_user_id_and_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_quotes_on_user_id_and_created_at ON public.quotes USING btree (user_id, created_at);


--
-- Name: index_surcharges_on_carrier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_surcharges_on_carrier ON public.surcharges USING btree (carrier);


--
-- Name: index_surcharges_on_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_surcharges_on_code ON public.surcharges USING btree (code);


--
-- Name: index_users_on_lower_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_lower_email ON public.users USING btree (lower((email)::text));


--
-- Name: index_users_on_magic_link_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_magic_link_token ON public.users USING btree (magic_link_token);


--
-- Name: index_users_on_magic_link_token_digest; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_magic_link_token_digest ON public.users USING btree (magic_link_token_digest);


--
-- Name: quotes fk_rails_02b555fb4d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT fk_rails_02b555fb4d FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audit_logs fk_rails_1f26bc34ae; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fk_rails_1f26bc34ae FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: magic_link_tokens fk_rails_6b06dc3bb8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.magic_link_tokens
    ADD CONSTRAINT fk_rails_6b06dc3bb8 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: customers fk_rails_9917eeaf5d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_rails_9917eeaf5d FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: quotes fk_rails_a1ab65f1f7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotes
    ADD CONSTRAINT fk_rails_a1ab65f1f7 FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO "schema_migrations" (version) VALUES
('20260809000001'),
('20260803000001'),
('20260411000001'),
('20260409000001'),
('20260408000001'),
('20260406000002'),
('20260406000001'),
('20260403062214'),
('20260403061820'),
('20260315100001'),
('20260315000001'),
('20260314000001'),
('20260313200001'),
('20260313100001'),
('20260313000001'),
('20260312200001'),
('20260312100001'),
('20260312000001'),
('20260310000001'),
('20260308100000'),
('20260308000000'),
('20260307200002'),
('20260307200001'),
('20260307000001'),
('20260305133210'),
('20260305133151'),
('20260214000001');

