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

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: orderservice
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'completed',
    'canceled'
);


ALTER TYPE public.order_status OWNER TO orderservice;

--
-- Name: transaction_status; Type: TYPE; Schema: public; Owner: orderservice
--

CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE public.transaction_status OWNER TO orderservice;

--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: orderservice
--

CREATE TYPE public.transaction_type AS ENUM (
    'payment',
    'refund',
    'adjustment'
);


ALTER TYPE public.transaction_type OWNER TO orderservice;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: orderservice
--

CREATE TABLE public.orders (
    order_id uuid DEFAULT gen_random_uuid() NOT NULL,
    auction_id uuid NOT NULL,
    user_winner_id uuid NOT NULL,
    user_seller_id uuid NOT NULL,
    final_price numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.orders OWNER TO orderservice;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: orderservice
--

CREATE TABLE public.transactions (
    transaction_id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    transaction_type public.transaction_type NOT NULL,
    transaction_status public.transaction_status DEFAULT 'pending'::public.transaction_status NOT NULL,
    payment_method json NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    shipping_address json NOT NULL,
    billing_address json NOT NULL
);


ALTER TABLE public.transactions OWNER TO orderservice;

--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: orderservice
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: orderservice
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: orders unique_auction_order; Type: CONSTRAINT; Schema: public; Owner: orderservice
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT unique_auction_order UNIQUE (auction_id);


--
-- Name: transactions transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: orderservice
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

