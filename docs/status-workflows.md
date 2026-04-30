# Sugar & Leather Vendor Portal — Status Workflows

Status transitions are enforced in domain service files, not scattered conditionals. Each transition writes an `AuditLog` entry. The diagrams below show all valid state machines.

---

## Application (`ApplicationStatus`)

```
[Applicant submits /apply]
         |
         v
    SUBMITTED
         |
    Admin opens
         |
         v
     IN_REVIEW
      /       \
   Admin      Admin
   rejects    approves
     |           |
     v           v
 REJECTED   APPROVED_PENDING_AGREEMENT
                 |
          Admin sends agreement email
                 |
                 v
          AGREEMENT_SENT
                 |
          Admin receives signed docs,
          marks agreement SIGNED
                 |
                 v
             SIGNED
                 |
          Partner account created
          and invite sent
                 |
                 v
           ACTIVATED
```

Terminal states: `REJECTED`, `ACTIVATED`.

Admin can reject from `IN_REVIEW` only. `ACTIVATED` is set when the partner account transitions to `ACTIVE`.

---

## Partner Account (`AccountStatus`)

```
[Admin creates partner record]
         |
         v
      INVITED
         |
    Partner sets password /
    admin confirms agreement signed
         |
         v
       ACTIVE  <----+
         |          |
   Admin suspends   Admin reactivates
         |          |
         v          |
     SUSPENDED -----+
         |
   Admin disables
         |
         v
      DISABLED
```

Partners can only access `/partner/*` when `ACTIVE`. `SUSPENDED` and `DISABLED` block login. `DISABLED` is not reversible in MVP.

---

## Agreement (`AgreementStatus`)

```
[Admin creates agreement for application]
         |
         v
       DRAFT
         |
   Admin sends NDA + agreement email
         |
         v
       SENT
      /    \
  Admin     Admin
  marks     voids
  signed    (wrong recipient,
    |        resend needed)
    v            |
  SIGNED      VOIDED
               |
          [Admin creates
           new DRAFT]
```

Also: `EXPIRED` — admin can mark an unresponsive agreement expired. Expired agreements can be followed by a new `DRAFT`.

---

## Referral (`ReferralStatus` + `AttributionStatus`)

```
[Partner submits referral]
         |
         v
   Attribution lock attempt
    /              \
  Key unique      Key conflict
  (success)       (duplicate)
    |                  |
    v                  v
FIRST_ATTRIBUTED  DUPLICATE_NO_CREDIT
         \             /
          v           v
        PENDING_REVIEW
           /       \
        Admin      Admin
        approves   rejects
           |           |
           v           v
        APPROVED    REJECTED
           |
     Deal created and WON
           |
           v
        CONVERTED
           |
     (or deal goes LOST)
           |
           v
          LOST
```

- `DUPLICATE_NO_CREDIT` referrals can still be approved by admin but never generate commission.
- Referrals are immutable after creation. Partners cannot edit. Admin corrections require an audit-logged note or admin field edit.

---

## Deal (`DealStatus`)

```
[Admin creates deal from approved attributed referral]
         |
         v
       OPEN
      / | \
  Admin Admin Admin
  wins  loses cancels
    |    |      |
    v    v      v
  WON  LOST  CANCELLED
```

On `WON`:
- Commission engine runs.
- Partner agreement + tier rules are snapshotted.
- `CommissionEvent` records are created for upfront and trailing periods.

`LOST` and `CANCELLED` do not generate commission. If a deal was `WON` and later reversed, a clawback `CommissionEvent` is added — the `WON` record is not deleted.

---

## Commission (`CommissionStatus`)

```
[Deal WON — commission engine runs]
         |
         v
       STAGED
         |
    Hold/clawback window passes,
    admin marks payable
         |
         v
      PAYABLE
         |
    Admin includes in payout batch,
    payout marked PAID
         |
         v
        PAID
```

Parallel paths from any state:

```
STAGED / PAYABLE  --(Admin voids)-->  VOIDED
PAID             --(Clawback)-->  [new negative CommissionEvent: CLAWED_BACK]
```

- `VOIDED` is for events that should not pay (e.g., data correction). Voiding is audited.
- Clawbacks create a new negative `CommissionEvent` with `kind: CLAWBACK`. They do not edit the original `PAID` event.

---

## Payout (`PayoutStatus`)

```
[Admin creates payout batch]
         |
         v
       DRAFT
         |
   Admin submits / initiates
         |
         v
     PROCESSING
         |
   Admin confirms payment sent
         |
         v
        PAID
```

Parallel path:

```
DRAFT / PROCESSING  --(Admin voids)-->  VOIDED
```

A voided payout releases its `PayoutLine` records so they can be included in a future batch. `CommissionEvent` records associated with a voided payout revert to `PAYABLE`.

---

## Notification (`NotificationStatus`)

```
[Service queues notification]
         |
         v
      QUEUED
         |
   Email/in-app send attempted
      /       \
  Success    Failure
    |             |
    v             v
  SENT          FAILED
    |
  User reads (in-app)
    |
    v
   READ
    |
  User dismisses
    |
    v
 DISMISSED
```

`FAILED` notifications are logged but not automatically retried in MVP. Admin can view failed sends in the audit log.

---

## Quarterly Activity

Quarterly activity is a computed aggregate, not a status field. Each quarter:

1. The dashboard aggregates referrals submitted, referrals approved, deals won, revenue attributed, and payout earned per partner.
2. Admin reviews activity against tier requirements.
3. Admin can record a manual override with a reason (e.g., exception granted, tier downgrade).

There is no automated tier downgrade in MVP. Tier changes are admin-initiated and do not retroactively affect historical commissions.
