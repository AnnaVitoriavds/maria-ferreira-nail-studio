<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Public site is one scrolling page (src/routes/index.tsx) with anchor sections, as the owner requested; admin lives at /admin (ssr:false, role checked via user_roles).
- Booking availability and creation run only through security-definer database functions (get_available_slots, create_booking_request, record_date_selection) so conflicts are checked atomically and visitors never read client data.
- Public signup is disabled; the first account added in Users becomes admin via a database trigger, so no admin credentials live in code.
- Uploaded media goes to the private "media" bucket and is stored as long-lived signed URLs, because public buckets are blocked in this workspace.
