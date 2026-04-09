-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  is_test_data boolean DEFAULT false,
  is_test_data_active boolean DEFAULT true,
  CONSTRAINT admin_posts_pkey PRIMARY KEY (id),
  CONSTRAINT admin_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.applications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  discord_name text,
  btag text,
  race text,
  tier text,
  intro text,
  status text DEFAULT '대기중'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  phone text,
  tester_id uuid,
  test_result text,
  is_test_data boolean DEFAULT false,
  is_test_data_active boolean DEFAULT true,
  is_streamer boolean DEFAULT false,
  streamer_platform text,
  streamer_url text,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_applications_tester_id FOREIGN KEY (tester_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.ladder_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  host_id uuid,
  status text DEFAULT '모집중'::text,
  match_type text CHECK (match_type = ANY (ARRAY['1v1'::text, '2v2'::text, '3v3'::text, '4v4'::text, '5v5'::text])),
  team_a_ids ARRAY DEFAULT '{}'::uuid[],
  team_b_ids ARRAY DEFAULT '{}'::uuid[],
  team_a_races ARRAY DEFAULT '{}'::text[],
  team_b_races ARRAY DEFAULT '{}'::text[],
  winning_team text,
  map_name text,
  created_at timestamp with time zone DEFAULT now(),
  score_a integer DEFAULT 0,
  score_b integer DEFAULT 0,
  betting_closed_at timestamp with time zone,
  current_race_picker uuid,
  is_test_data boolean DEFAULT false,
  is_test_data_active boolean DEFAULT true,
  CONSTRAINT ladder_matches_pkey PRIMARY KEY (id),
  CONSTRAINT ladder_matches_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.ladders (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  rank integer,
  nickname text,
  points integer,
  race text,
  win integer,
  lose integer,
  win_rate text,
  is_test_data boolean DEFAULT false,
  is_test_data_active boolean DEFAULT true,
  CONSTRAINT ladders_pkey PRIMARY KEY (id)
);
CREATE TABLE public.match_bets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid,
  user_id uuid,
  team_choice text,
  bet_amount integer,
  odds double precision,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT match_bets_pkey PRIMARY KEY (id),
  CONSTRAINT match_bets_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.ladder_matches(id),
  CONSTRAINT match_bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.match_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid,
  set_number integer,
  race_type text,
  team_a_entry jsonb,
  team_b_entry jsonb,
  winner_team text,
  status text DEFAULT '엔트리제출중'::text,
  created_at timestamp with time zone DEFAULT now(),
  race_cards ARRAY,
  team_a_ready boolean DEFAULT false,
  team_b_ready boolean DEFAULT false,
  team_a_rest_ids ARRAY,
  team_b_rest_ids ARRAY,
  CONSTRAINT match_sets_pkey PRIMARY KEY (id),
  CONSTRAINT match_sets_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.ladder_matches(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  link_to text,
  is_test_data boolean DEFAULT false,
  is_test_data_active boolean DEFAULT true,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.point_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  amount integer,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT point_logs_pkey PRIMARY KEY (id),
  CONSTRAINT point_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.posts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  author_name text,
  category text,
  title text,
  content text,
  views integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_test_data boolean DEFAULT false,
  is_test_data_active boolean DEFAULT true,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  discord_name text,
  role text DEFAULT 'applicant'::text,
  "Clan_Point" integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ByID text,
  race text DEFAULT '미지정'::text,
  intro text DEFAULT ''::text,
  "Ladder_MMR" integer DEFAULT 1000,
  is_in_queue boolean DEFAULT false,
  vote_to_start boolean DEFAULT false,
  is_test_account boolean DEFAULT false,
  is_test_account_active boolean DEFAULT true,
  wins integer,
  losses integer,
  is_streamer boolean DEFAULT false,
  streamer_platform text,
  streamer_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.system_settings (
  key text NOT NULL,
  value_bool boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  description text,
  CONSTRAINT system_settings_pkey PRIMARY KEY (key)
);