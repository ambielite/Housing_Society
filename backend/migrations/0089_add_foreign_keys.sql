-- Add relationships after every referenced table exists.

ALTER TABLE "amcs" ADD CONSTRAINT "amcs_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id");

ALTER TABLE "amcs" ADD CONSTRAINT "amcs_vendor_id_vendors_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "amcs" ADD CONSTRAINT "amcs_asset_id_assets_fk" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id");

ALTER TABLE "amcs" ADD CONSTRAINT "amcs_parent_amc_id_amcs_fk" FOREIGN KEY ("parent_amc_id") REFERENCES "amcs" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_asset_id_assets_fk" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "asset_lifecycle" ADD CONSTRAINT "asset_lifecycle_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "asset_lifecycle" ADD CONSTRAINT "asset_lifecycle_asset_id_assets_fk" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "asset_maintenance" ADD CONSTRAINT "asset_maintenance_asset_id_assets_fk" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "asset_qr_tags" ADD CONSTRAINT "asset_qr_tags_asset_id_assets_fk" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "assets" ADD CONSTRAINT "assets_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_asset_categories_fk" FOREIGN KEY ("category_id") REFERENCES "asset_categories" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "assets" ADD CONSTRAINT "assets_vendor_id_vendors_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "assets" ADD CONSTRAINT "assets_tower_id_towers_fk" FOREIGN KEY ("tower_id") REFERENCES "towers" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "assets" ADD CONSTRAINT "assets_floor_id_floors_fk" FOREIGN KEY ("floor_id") REFERENCES "floors" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "assets" ADD CONSTRAINT "assets_unit_id_units_fk" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "clusters" ADD CONSTRAINT "clusters_organization_id_organizations_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "community_classifieds" ADD CONSTRAINT "community_classifieds_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id");

ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_community_posts_fk" FOREIGN KEY ("post_id") REFERENCES "community_posts" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_parent_comment_id_community_comments_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "community_comments" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "community_event_rsvps" ADD CONSTRAINT "community_event_rsvps_event_id_community_events_fk" FOREIGN KEY ("event_id") REFERENCES "community_events" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_event_rsvps" ADD CONSTRAINT "community_event_rsvps_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_events" ADD CONSTRAINT "community_events_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_forums" ADD CONSTRAINT "community_forums_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_governance_meetings" ADD CONSTRAINT "community_governance_meetings_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_governance_meetings" ADD CONSTRAINT "community_governance_meetings_meeting_id_community_meetings_fk" FOREIGN KEY ("meeting_id") REFERENCES "community_meetings" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_governance_rules" ADD CONSTRAINT "community_governance_rules_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_group_members" ADD CONSTRAINT "community_group_members_group_id_community_groups_fk" FOREIGN KEY ("group_id") REFERENCES "community_groups" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_groups" ADD CONSTRAINT "community_groups_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_meeting_action_items" ADD CONSTRAINT "community_meeting_action_items_meeting_id_community_meetings_fk" FOREIGN KEY ("meeting_id") REFERENCES "community_meetings" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_meeting_action_items" ADD CONSTRAINT "community_meeting_action_items_agenda_id_community_meeting_agendas_fk" FOREIGN KEY ("agenda_id") REFERENCES "community_meeting_agendas" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "community_meeting_agendas" ADD CONSTRAINT "community_meeting_agendas_meeting_id_community_meetings_fk" FOREIGN KEY ("meeting_id") REFERENCES "community_meetings" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_meeting_attendance" ADD CONSTRAINT "community_meeting_attendance_meeting_id_community_meetings_fk" FOREIGN KEY ("meeting_id") REFERENCES "community_meetings" ("id");

ALTER TABLE "community_meeting_minutes" ADD CONSTRAINT "community_meeting_minutes_meeting_id_community_meetings_fk" FOREIGN KEY ("meeting_id") REFERENCES "community_meetings" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_meetings" ADD CONSTRAINT "community_meetings_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id");

ALTER TABLE "community_moderations" ADD CONSTRAINT "community_moderations_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id");

ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_forum_id_community_forums_fk" FOREIGN KEY ("forum_id") REFERENCES "community_forums" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_voting_ballots" ADD CONSTRAINT "community_voting_ballots_voting_id_community_votings_fk" FOREIGN KEY ("voting_id") REFERENCES "community_votings" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_voting_ballots" ADD CONSTRAINT "community_voting_ballots_eligibility_id_community_voting_eligibilities_fk" FOREIGN KEY ("eligibility_id") REFERENCES "community_voting_eligibilities" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_voting_eligibilities" ADD CONSTRAINT "community_voting_eligibilities_voting_id_community_votings_fk" FOREIGN KEY ("voting_id") REFERENCES "community_votings" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_voting_options" ADD CONSTRAINT "community_voting_options_voting_id_community_votings_fk" FOREIGN KEY ("voting_id") REFERENCES "community_votings" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_voting_votes" ADD CONSTRAINT "community_voting_votes_voting_id_community_votings_fk" FOREIGN KEY ("voting_id") REFERENCES "community_votings" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_voting_votes" ADD CONSTRAINT "community_voting_votes_ballot_id_community_voting_ballots_fk" FOREIGN KEY ("ballot_id") REFERENCES "community_voting_ballots" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_voting_votes" ADD CONSTRAINT "community_voting_votes_option_id_community_voting_options_fk" FOREIGN KEY ("option_id") REFERENCES "community_voting_options" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_votings" ADD CONSTRAINT "community_votings_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_votings" ADD CONSTRAINT "community_votings_governance_meeting_id_community_governance_meetings_fk" FOREIGN KEY ("governance_meeting_id") REFERENCES "community_governance_meetings" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "community_votings" ADD CONSTRAINT "community_votings_meeting_id_community_meetings_fk" FOREIGN KEY ("meeting_id") REFERENCES "community_meetings" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "floors" ADD CONSTRAINT "floors_tower_id_towers_fk" FOREIGN KEY ("tower_id") REFERENCES "towers" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "inventory" ADD CONSTRAINT "inventory_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_fk" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_id_journals_fk" FOREIGN KEY ("journal_id") REFERENCES "journals" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_accounts_fk" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_stakeholder_id_residents_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "residents" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id");

ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_asset_id_assets_fk" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_amc_id_amcs_fk" FOREIGN KEY ("amc_id") REFERENCES "amcs" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_vendor_id_vendors_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "multi_society_access" ADD CONSTRAINT "multi_society_access_organization_id_organizations_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id");

ALTER TABLE "multi_society_access" ADD CONSTRAINT "multi_society_access_cluster_id_clusters_fk" FOREIGN KEY ("cluster_id") REFERENCES "clusters" ("id");

ALTER TABLE "multi_society_access" ADD CONSTRAINT "multi_society_access_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id");

ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_template_id_notification_templates_fk" FOREIGN KEY ("template_id") REFERENCES "notification_templates" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "owner_units" ADD CONSTRAINT "owner_units_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE "owner_units" ADD CONSTRAINT "owner_units_owner_id_residents_fk" FOREIGN KEY ("owner_id") REFERENCES "residents" ("id") ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE "owner_units" ADD CONSTRAINT "owner_units_unit_id_units_fk" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON UPDATE CASCADE ON DELETE NO ACTION;

ALTER TABLE "patrol_checkpoints" ADD CONSTRAINT "patrol_checkpoints_patrol_id_security_patrols_fk" FOREIGN KEY ("patrol_id") REFERENCES "security_patrols" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "patrol_checkpoints" ADD CONSTRAINT "patrol_checkpoints_checkpoint_id_security_checkpoints_fk" FOREIGN KEY ("checkpoint_id") REFERENCES "security_checkpoints" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "residents" ADD CONSTRAINT "residents_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "security_audits" ADD CONSTRAINT "security_audits_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "security_audits" ADD CONSTRAINT "security_audits_user_id_staff_fk" FOREIGN KEY ("user_id") REFERENCES "staff" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "security_checkpoints" ADD CONSTRAINT "security_checkpoints_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "security_emergencies" ADD CONSTRAINT "security_emergencies_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "security_emergencies" ADD CONSTRAINT "security_emergencies_reported_by_staff_fk" FOREIGN KEY ("reported_by") REFERENCES "staff" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "security_emergencies" ADD CONSTRAINT "security_emergencies_unit_id_units_fk" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "security_emergencies" ADD CONSTRAINT "security_emergencies_assigned_to_staff_fk" FOREIGN KEY ("assigned_to") REFERENCES "staff" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_unit_id_units_fk" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_assigned_to_staff_fk" FOREIGN KEY ("assigned_to") REFERENCES "staff" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "security_patrols" ADD CONSTRAINT "security_patrols_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "security_patrols" ADD CONSTRAINT "security_patrols_staff_id_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "staff" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "shifts" ADD CONSTRAINT "shifts_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "societies" ADD CONSTRAINT "societies_organization_id_organizations_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "societies" ADD CONSTRAINT "societies_cluster_id_clusters_fk" FOREIGN KEY ("cluster_id") REFERENCES "clusters" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "society_settings" ADD CONSTRAINT "society_settings_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "staff" ADD CONSTRAINT "staff_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id");

ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_staff_id_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "staff" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_staff_id_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "staff" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "staff_rosters" ADD CONSTRAINT "staff_rosters_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "staff_rosters" ADD CONSTRAINT "staff_rosters_staff_id_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "staff" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "staff_rosters" ADD CONSTRAINT "staff_rosters_shift_id_shifts_fk" FOREIGN KEY ("shift_id") REFERENCES "shifts" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "staff_tasks" ADD CONSTRAINT "staff_tasks_staff_id_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "staff" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "staff_unit_assignments" ADD CONSTRAINT "staff_unit_assignments_staff_id_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "staff" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "staff_unit_assignments" ADD CONSTRAINT "staff_unit_assignments_unit_id_units_fk" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_inventory_id_inventory_fk" FOREIGN KEY ("inventory_id") REFERENCES "inventory" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "towers" ADD CONSTRAINT "towers_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "units" ADD CONSTRAINT "units_floor_id_floors_fk" FOREIGN KEY ("floor_id") REFERENCES "floors" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "vendors" ADD CONSTRAINT "vendors_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_society_id_societies_fk" FOREIGN KEY ("society_id") REFERENCES "societies" ("id");

ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_schedule_id_maintenance_schedules_fk" FOREIGN KEY ("schedule_id") REFERENCES "maintenance_schedules" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_asset_id_assets_fk" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_amc_id_amcs_fk" FOREIGN KEY ("amc_id") REFERENCES "amcs" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_vendor_id_vendors_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

