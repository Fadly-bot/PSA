CREATE INDEX "book_inventories_status_idx" ON "book_inventories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "book_inventories_deleted_at_idx" ON "book_inventories" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "books_status_idx" ON "books" USING btree ("status");--> statement-breakpoint
CREATE INDEX "books_deleted_at_idx" ON "books" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "borrowings_status_idx" ON "borrowings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "borrowings_status_due_date_idx" ON "borrowings" USING btree ("status","due_date");--> statement-breakpoint
CREATE INDEX "borrowings_borrow_date_idx" ON "borrowings" USING btree ("borrow_date");--> statement-breakpoint
CREATE INDEX "borrowings_member_id_idx" ON "borrowings" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "borrowings_created_at_idx" ON "borrowings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "fines_status_idx" ON "fines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "returns_return_date_idx" ON "returns" USING btree ("return_date");