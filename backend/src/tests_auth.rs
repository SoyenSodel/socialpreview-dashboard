#[cfg(test)]
mod tests {
    use crate::auth::{hash_password, validate_password_complexity, verify_password};

    #[test]
    fn test_password_complexity_valid() {
        assert!(validate_password_complexity("StrongPassword123!").is_ok());
    }

    #[test]
    fn test_password_complexity_too_short() {
        assert!(validate_password_complexity("Short1!").is_err());
    }

    #[test]
    fn test_password_complexity_no_uppercase() {
        assert!(validate_password_complexity("weakpassword123!").is_err());
    }

    #[test]
    fn test_password_complexity_no_digit() {
        assert!(validate_password_complexity("NoDigitsHere!").is_err());
    }

    #[test]
    fn test_hashing_and_verification() {
        let password = "MySecretPassword123!";
        let hash = hash_password(password).expect("Failed to hash password");
        let is_valid = verify_password(password, &hash).expect("Failed to verify password");
        assert!(is_valid);

        let is_invalid =
            verify_password("WrongPassword", &hash).expect("Failed to verify password");
        assert!(!is_invalid);
    }
}
