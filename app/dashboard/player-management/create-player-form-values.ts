export type CreatePlayerFormValues = {
  studentDigits: string;
  fullName: string;
  email: string;
  faculty: string;
  batch: string;
  sport: string;
  teamName: string;
  position: string;
  jersey: string;
  contact: string;
};

export const INITIAL_CREATE_PLAYER_VALUES: CreatePlayerFormValues = {
  studentDigits: "",
  fullName: "",
  email: "",
  faculty: "Computing",
  batch: "",
  sport: "",
  teamName: "",
  position: "",
  jersey: "",
  contact: "",
};
