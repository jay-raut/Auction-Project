--
-- PostgreSQL database dump
--

-- Dumped from database version 15.10 (Debian 15.10-1.pgdg120+1)
-- Dumped by pg_dump version 17.2

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
-- Name: addresses; Type: TABLE; Schema: public; Owner: authservice
--

CREATE TABLE public.addresses (
    address_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    street_address character varying(255) NOT NULL,
    street_number integer NOT NULL,
    city character varying(100) NOT NULL,
    zip_code character varying(20) NOT NULL,
    country character varying(100) NOT NULL
);


ALTER TABLE public.addresses OWNER TO authservice;

--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: authservice
--

CREATE TABLE public.payment_methods (
    payment_method_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    card_number character varying(16) NOT NULL,
    name_on_card character varying(255) NOT NULL,
    expiration_date json NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payment_methods OWNER TO authservice;

--
-- Name: users; Type: TABLE; Schema: public; Owner: authservice
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


ALTER TABLE public.users OWNER TO authservice;

--
-- Name: COLUMN users.is_active; Type: COMMENT; Schema: public; Owner: authservice
--

COMMENT ON COLUMN public.users.is_active IS 'Use for soft deletion';


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: authservice
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (address_id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: authservice
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (payment_method_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: authservice
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: authservice
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: authservice
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: payment_methods payment_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: authservice
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

