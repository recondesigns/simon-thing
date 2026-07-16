import MuiButton, { type ButtonProps } from "@mui/material/Button";

export type { ButtonProps };

export default function Button(props: ButtonProps) {
  return <MuiButton {...props} />;
}
