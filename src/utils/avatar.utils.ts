import { createAvatar } from "@dicebear/core";
import { botttsNeutral } from "@dicebear/collection";

const avatars = [
  "Adrian",
  "Robert",
  "Amaya",
  "Liam",
  "Caleb",
  "Chase",
  "Leah",
  "Jack"
];

export const generateRandomAvatar = (): string => {
  const randomIndex = Math.floor(Math.random() * avatars.length);
  const avatarName = avatars[randomIndex];

  return createAvatar(botttsNeutral, {
    seed: avatarName,
  }).toString();
}
