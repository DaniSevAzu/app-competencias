import { getInformeTrabajador } from "@/app/actions/informes";
import { notFound } from "next/navigation";
import { InformeTrabajadorClient } from "./InformeTrabajadorClient";

export default async function InformeTrabajadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getInformeTrabajador(id);
  if (!data) notFound();

  return <InformeTrabajadorClient data={data} />;
}
