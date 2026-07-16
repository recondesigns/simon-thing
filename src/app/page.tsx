import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export default function Home() {
  return (
    <main>
      <Stack
        spacing={2}
        sx={{
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          simon-thing
        </Typography>
        <Button variant="contained" startIcon={<PlayArrowIcon />}>
          Start
        </Button>
      </Stack>
    </main>
  );
}
