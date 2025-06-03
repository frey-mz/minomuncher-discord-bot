const filePath = "./replay.ttrm";
const apiUrl = "https://6027-104-1-155-198.ngrok-free.app/api/minomuncher";

const file = await Bun.file(filePath).text();

try {
  const response = await fetch(apiUrl, {
    method: "POST",
    body: file,
  });

  const result = await response.text(); // or response.json() if expecting JSON
  console.log("Response:", result);
} catch (error) {
  console.error("Error uploading file:", error);
}
