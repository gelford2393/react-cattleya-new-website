import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import type { PoolSummary } from "../home.types";
import { formatCurrency } from "../home.utils";

type PoolsSectionProps = {
  poolRows: PoolSummary[];
  noteHtml: string;
  hasNoteContent: boolean;
};

export function PoolsSection({ poolRows, noteHtml, hasNoteContent }: PoolsSectionProps) {
  return (
    <>
      <div className="mb-4 flex flex-col items-start gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">Pools & Rates</h2>
        <span className="text-[10px] uppercase tracking-widest text-[#a4d473] sm:text-xs">
          {poolRows.length} pool options
        </span>
      </div>

      <Table className="min-w-[700px] text-xs sm:text-sm">
        <TableHeader>
          <TableRow className="border-white/15 hover:bg-transparent">
            <TableHead className="text-white/80">Pool</TableHead>
            <TableHead className="text-white/80">Name</TableHead>
            <TableHead className="text-white/80">Capacity</TableHead>
            <TableHead className="text-white/80">Day Rate</TableHead>
            <TableHead className="text-white/80">Night Rate</TableHead>
            <TableHead className="text-right text-white/80">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {poolRows.map((pool) => {
            const rates = pool.rates ?? {};

            return (
              <TableRow key={pool.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-semibold text-white">Pool {pool.pool_number}</TableCell>
                <TableCell className="text-white/90">{pool.name}</TableCell>
                <TableCell className="text-white/85">{pool.capacity ?? "N/A"}</TableCell>
                <TableCell className="text-white/85">{formatCurrency(rates.day)}</TableCell>
                <TableCell className="text-white/85">{formatCurrency(rates.night)}</TableCell>
                <TableCell className="text-right">
                  <Link to={`/pools/${pool.id}`} className="text-[#a4d473] hover:text-[#feb234]">
                    Details
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#a4d473]">Notes</h3>
        {hasNoteContent ? (
          <div
            className="mt-3 text-sm leading-7 text-white/90 [&_a]:font-semibold [&_a]:underline [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: noteHtml }}
          />
        ) : (
          <Text as="p" className="mt-3 text-sm text-white/80">
            Notes will be posted soon.
          </Text>
        )}
      </div>
    </>
  );
}
