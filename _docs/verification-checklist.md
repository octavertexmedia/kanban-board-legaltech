# Verification Checklist

## 1. Authentication & Access Control

- [x] Remove public auth paths (Signup, Create account, Forgot password)
- [x] Remove demo credentials from login page
- [ ] Introduce/verify SUPER_ADMIN, ADMIN, MANAGER, USER role hierarchy
- [ ] Implement RBAC in Frontend
- [ ] Implement RBAC in Backend API
- [ ] Admin-controlled user creation

## 2. Dashboard Real-time Capabilities

- [ ] Implement real-time dashboard data (no mock data)
- [ ] Real-time feed for ticket updates, assignments, status changes, comments
- [ ] Verify counters and lists are data-backed

## 3. Notifications

- [ ] Real-time (Pusher) notifications for assignment, status change, comments
- [ ] Email (Resend) notifications for assignment, comment, status change
- [ ] Verify email trigger logic and payload

## 4. Kanban Board permissions

- [ ] Admin controls for what Managers and Users can move
- [ ] Board behavior respects role config dynamically
- [ ] Changes persist across sessions
