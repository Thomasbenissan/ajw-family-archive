import { notFound } from "next/navigation";
import {
  getFamilyData,
  getPersonTimeline,
  getUndatedFacts,
} from "@/lib/loadData";
import PersonProfileClient from "./PersonProfileClient";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const family = getFamilyData();
  const person = family.find((p) => p.id === id);
  if (!person) notFound();

  const timeline = getPersonTimeline(id);
  const undatedFacts = getUndatedFacts(id);

  return (
    <PersonProfileClient
      person={person}
      allPeople={family}
      timeline={timeline}
      undatedFacts={undatedFacts}
    />
  );
}
