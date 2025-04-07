;; Policy Management Contract
;; Records insurance terms and coverage

;; Define data maps
(define-map policies
  { policy-id: uint }
  {
    owner: principal,
    premium: uint,
    coverage-amount: uint,
    start-block: uint,
    end-block: uint,
    active: bool
  }
)

(define-data-var next-policy-id uint u1)

;; Create a new policy
(define-public (create-policy (premium uint) (coverage-amount uint) (duration uint))
  (let
    (
      (policy-id (var-get next-policy-id))
      (start-block block-height)
      (end-block (+ block-height duration))
    )
    (asserts! (> premium u0) (err u1))
    (asserts! (> coverage-amount u0) (err u2))
    (asserts! (> duration u0) (err u3))

    ;; Update policy map
    (map-set policies
      { policy-id: policy-id }
      {
        owner: tx-sender,
        premium: premium,
        coverage-amount: coverage-amount,
        start-block: start-block,
        end-block: end-block,
        active: true
      }
    )

    ;; Increment policy ID counter
    (var-set next-policy-id (+ policy-id u1))

    (ok policy-id)
  )
)

;; Get policy details
(define-read-only (get-policy (policy-id uint))
  (map-get? policies { policy-id: policy-id })
)

;; Check if policy is active
(define-read-only (is-policy-active (policy-id uint))
  (let
    (
      (policy (unwrap-panic (map-get? policies { policy-id: policy-id })))
    )
    (and
      (get active policy)
      (<= (get start-block policy) block-height)
      (>= (get end-block policy) block-height)
    )
  )
)

;; Cancel policy (only by owner)
(define-public (cancel-policy (policy-id uint))
  (let
    (
      (policy (unwrap-panic (map-get? policies { policy-id: policy-id })))
    )
    (asserts! (is-eq tx-sender (get owner policy)) (err u4))

    (map-set policies
      { policy-id: policy-id }
      (merge policy { active: false })
    )

    (ok true)
  )
)

