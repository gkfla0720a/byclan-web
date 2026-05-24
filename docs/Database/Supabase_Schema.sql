-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  actor_id uuid,
  actor_by_id text,
  actor_role text,
  action_type text NOT NULL,
  target_table text NOT NULL,
  target_id text,
  before_data jsonb,
  after_data jsonb,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_test_data boolean DEFAULT false,
  CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.admin_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  is_test_data boolean DEFAULT false,
  is_test_data_active boolean DEFAULT true,
  CONSTRAINT admin_posts_pkey PRIMARY KEY (id),
  CONSTRAINT admin_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.applications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  discord_name text,
  btag text,
  race text,
  tier text,
  intro text,
  status text DEFAULT '대기중'::text CHECK (status IS NULL OR (status = ANY (ARRAY['pending'::text, 'passed'::text, 'failed'::text]))),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  phone text,
  tester_id uuid,
  test_result text,
  is_test_data boolean DEFAULT false,
  is_test_data_active boolean DEFAULT true,
  is_streamer boolean DEFAULT false,
  streamer_platform text,
  streamer_url text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  review_note_summary text,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fk_applications_tester_id FOREIGN KEY (tester_id) REFERENCES public.profiles(id),
  CONSTRAINT applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.clanpoint_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  amount integer,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  source_type text CHECK (source_type IS NULL OR (source_type = ANY (ARRAY['manual'::text, 'match'::text, 'bet'::text, 'application'::text, 'system'::text, 'event'::text]))),
  source_id text,
  balance_after integer,
  type text DEFAULT 'manual'::text,
  related_id text,
  is_test_data boolean DEFAULT false,
  CONSTRAINT clanpoint_logs_pkey PRIMARY KEY (id),
  CONSTRAINT point_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.comments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id bigint,
  user_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.developer_settings (
  key text NOT NULL,
  value_bool boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  description text,
  CONSTRAINT developer_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.ladder_match_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid,
  set_number integer,
  match_type text,
  team_a_entry jsonb,
  team_b_entry jsonb,
  winner_team text,
  status text DEFAULT '엔트리제출중'::text CHECK (status IS NULL OR (status = ANY (ARRAY['entry_pending'::text, 'in_progress'::text, 'completed'::text]))),
  created_at timestamp with time zone DEFAULT now(),
  race_cards ARRAY,
  team_a_ready boolean DEFAULT false,
  team_b_ready boolean DEFAULT false,
  team_a_rest_ids ARRAY,
  team_b_rest_ids ARRAY,
  team_a_withdraw_req boolean DEFAULT false,
  team_b_withdraw_req boolean DEFAULT false,
  set_mmr_applied boolean NOT NULL DEFAULT false,
  started_at timestamp with time zone DEFAULT now(),
  combo_code text,
  is_test_data boolean DEFAULT false,
  claimed_winner text,
  claim_time timestamp with time zone,
  CONSTRAINT ladder_match_sets_pkey PRIMARY KEY (id),
  CONSTRAINT fk_match_sets_parent FOREIGN KEY (match_id) REFERENCES public.ladder_record(id)
);
CREATE TABLE public.ladder_queue (
  user_id uuid NOT NULL,
  is_in_queue boolean NOT NULL DEFAULT false,
  vote_to_start boolean NOT NULL DEFAULT false,
  queue_joined_at timestamp with time zone,
  CONSTRAINT ladder_queue_pkey PRIMARY KEY (user_id),
  CONSTRAINT ladder_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.ladder_rankings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  ladder_mmr integer DEFAULT 1000,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  win_rate double precision DEFAULT 0.0,
  favorite_race text,
  updated_at timestamp with time zone DEFAULT now(),
  team_mmr integer NOT NULL DEFAULT 0,
  total_mmr integer,
  recent_total_delta integer NOT NULL DEFAULT 0,
  race_combo_stats jsonb,
  CONSTRAINT ladder_rankings_pkey PRIMARY KEY (id),
  CONSTRAINT ladder_rankings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.ladder_record (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_type text NOT NULL,
  status text DEFAULT 'in_progress'::text,
  team_a_ids ARRAY DEFAULT '{}'::uuid[],
  team_b_ids ARRAY DEFAULT '{}'::uuid[],
  team_a_races ARRAY DEFAULT '{}'::text[],
  team_b_races ARRAY DEFAULT '{}'::text[],
  score_a integer DEFAULT 0,
  score_b integer DEFAULT 0,
  winner_team text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT ladder_record_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ladder_settlement (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  user_id uuid NOT NULL,
  team text NOT NULL CHECK (team = ANY (ARRAY['A'::text, 'B'::text])),
  is_winner boolean NOT NULL,
  mmr_change integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ladder_settlement_pkey PRIMARY KEY (id),
  CONSTRAINT fk_settlement_match FOREIGN KEY (match_id) REFERENCES public.ladder_record(id),
  CONSTRAINT fk_settlement_user FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.match_bets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid,
  user_id uuid,
  team_choice text,
  bet_amount integer,
  odds double precision,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'pending'::text,
  payout integer DEFAULT 0,
  settled_at timestamp with time zone,
  CONSTRAINT match_bets_pkey PRIMARY KEY (id),
  CONSTRAINT match_bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.mmr_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  category text NOT NULL,
  action_type text NOT NULL,
  source_type text NOT NULL DEFAULT 'system'::text,
  is_manual boolean NOT NULL DEFAULT false,
  actor_id uuid,
  actor_by_id text,
  actor_role text,
  target_user_id uuid,
  target_table text,
  target_id text,
  summary text,
  before_data jsonb,
  after_data jsonb,
  meta jsonb,
  CONSTRAINT mmr_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id),
  CONSTRAINT activity_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notice_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  is_test_data boolean DEFAULT false,
  is_test_data_active boolean DEFAULT true,
  CONSTRAINT notice_posts_pkey PRIMARY KEY (id),
  CONSTRAINT notice_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
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
  type text CHECK (type IS NULL OR (type = ANY (ARRAY['application'::text, 'match'::text, 'match_set'::text, 'bet'::text, 'point'::text, 'system'::text, 'notice'::text, 'admin'::text]))),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.post_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id bigint,
  user_id uuid,
  vote_type text CHECK (vote_type = ANY (ARRAY['like'::text, 'dislike'::text])),
  CONSTRAINT post_votes_pkey PRIMARY KEY (id),
  CONSTRAINT post_votes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.posts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  category text DEFAULT '자유'::text,
  title text,
  content text,
  views integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_test_data boolean DEFAULT false,
  is_test_data_active boolean DEFAULT true,
  attachment_urls jsonb,
  link_url text,
  likes integer,
  dislikes integer,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profile_meta (
  user_id uuid NOT NULL,
  last_login_at timestamp with time zone,
  last_daily_bonus_at date,
  last_discord_checkin_at date,
  is_streamer boolean NOT NULL DEFAULT false,
  streamer_platform text,
  streamer_url text,
  is_test_account boolean NOT NULL DEFAULT false,
  is_test_account_active boolean NOT NULL DEFAULT true,
  CONSTRAINT profile_meta_pkey PRIMARY KEY (user_id),
  CONSTRAINT profile_meta_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profile_oauth (
  user_id uuid NOT NULL,
  discord_id text,
  google_sub text,
  google_email text,
  google_name text,
  google_avatar_url text,
  auth_provider text DEFAULT 'email'::text,
  CONSTRAINT profile_oauth_pkey PRIMARY KEY (user_id),
  CONSTRAINT profile_oauth_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text DEFAULT '''guest''::text'::text CHECK (role IS NULL OR (role = ANY (ARRAY['developer'::text, 'master'::text, 'admin'::text, 'veteran'::text, 'member'::text, 'rookie'::text, 'applicant'::text, 'associate'::text, 'guest'::text, 'banned'::text]))),
  clan_point integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  race text DEFAULT '미지정'::text,
  intro text DEFAULT ''::text,
  rookie_since timestamp with time zone,
  by_id text,
  is_active boolean DEFAULT true,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);