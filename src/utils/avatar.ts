/**
 * Utility functions for avatar handling
 */

/**
 * Generates initials from first name and last name
 * @param firstName - First name of the person
 * @param lastName - Last name of the person
 * @returns Two character initials in uppercase
 */
export const getInitials = (firstName: string, lastName: string): string => {
  if (!firstName || !lastName) {
    return "??";
  }
  
  const firstInitial = firstName.trim().charAt(0).toUpperCase();
  const lastInitial = lastName.trim().charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
};

/**
 * Generates initials from a full name string
 * @param fullName - Full name of the person
 * @returns Two character initials in uppercase
 */
export const getInitialsFromFullName = (fullName: string): string => {
  if (!fullName) {
    return "??";
  }
  
  const nameParts = fullName.trim().split(" ");
  
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase().repeat(2);
  }
  
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
};