import HomeClient from "./HomeClient";
import { getFamilyData, getMigrations } from "@/lib/loadData";

export default function Home() {
  const familyData = getFamilyData();
  const migrations = getMigrations();
  return <HomeClient familyData={familyData} migrations={migrations} />;
}
