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
-- Name: auction_type_enum; Type: TYPE; Schema: public; Owner: auctionservice
--

CREATE TYPE public.auction_type_enum AS ENUM (
    'dutch_auction',
    'forward_auction'
);


ALTER TYPE public.auction_type_enum OWNER TO auctionservice;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auctions; Type: TABLE; Schema: public; Owner: auctionservice
--

CREATE TABLE public.auctions (
    auction_id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_name character varying(255) NOT NULL,
    item_description text,
    auction_winner uuid,
    auction_owner uuid,
    start_time timestamp with time zone DEFAULT now() NOT NULL,
    auction_type public.auction_type_enum NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    starting_amount numeric NOT NULL,
    shipping_cost numeric DEFAULT 0 NOT NULL
);


ALTER TABLE public.auctions OWNER TO auctionservice;

--
-- Name: dutch_auction; Type: TABLE; Schema: public; Owner: auctionservice
--

CREATE TABLE public.dutch_auction (
    auction_id uuid NOT NULL
);


ALTER TABLE public.dutch_auction OWNER TO auctionservice;

--
-- Name: forward_auction; Type: TABLE; Schema: public; Owner: auctionservice
--

CREATE TABLE public.forward_auction (
    auction_id uuid NOT NULL,
    end_time timestamp with time zone
);


ALTER TABLE public.forward_auction OWNER TO auctionservice;

--
-- Name: auctions auctions_pkey; Type: CONSTRAINT; Schema: public; Owner: auctionservice
--

ALTER TABLE ONLY public.auctions
    ADD CONSTRAINT auctions_pkey PRIMARY KEY (auction_id);


--
-- Name: dutch_auction dutch_auction_pkey; Type: CONSTRAINT; Schema: public; Owner: auctionservice
--

ALTER TABLE ONLY public.dutch_auction
    ADD CONSTRAINT dutch_auction_pkey PRIMARY KEY (auction_id);


--
-- Name: forward_auction forward_auction_pkey; Type: CONSTRAINT; Schema: public; Owner: auctionservice
--

ALTER TABLE ONLY public.forward_auction
    ADD CONSTRAINT forward_auction_pkey PRIMARY KEY (auction_id);


--
-- Name: dutch_auction dutch_auction_auction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: auctionservice
--

ALTER TABLE ONLY public.dutch_auction
    ADD CONSTRAINT dutch_auction_auction_id_fkey FOREIGN KEY (auction_id) REFERENCES public.auctions(auction_id) ON DELETE CASCADE;


--
-- Name: forward_auction forward_auction_auction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: auctionservice
--

ALTER TABLE ONLY public.forward_auction
    ADD CONSTRAINT forward_auction_auction_id_fkey FOREIGN KEY (auction_id) REFERENCES public.auctions(auction_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

