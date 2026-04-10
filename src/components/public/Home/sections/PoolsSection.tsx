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

      <div className="flex flex-col gap-3 md:hidden">
        {poolRows.map((pool) => {
          const rates = pool.rates ?? {};

          return (
            <div key={pool.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <Link
                to={`/pools/${pool.id}`}
                className="text-sm font-semibold text-white underline-offset-4 hover:text-[#a4d473] hover:underline"
              >
                Pool {pool.pool_number}
              </Link>

              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-white/65">Name</span>
                <span className="text-right text-white/90">{pool.name}</span>

                <span className="text-white/65">Capacity</span>
                <span className="text-right text-white/85">{pool.capacity ?? "N/A"}</span>

                <span className="text-white/65">Day Rate</span>
                <span className="text-right text-white/85">{formatCurrency(rates.day)}</span>

                <span className="text-white/65">Night Rate</span>
                <span className="text-right text-white/85">{formatCurrency(rates.night)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Table className="hidden text-sm md:table">
        <TableHeader>
          <TableRow className="border-white/15 hover:bg-transparent">
            <TableHead className="text-white/80">Pool</TableHead>
            <TableHead className="text-white/80">Name</TableHead>
            <TableHead className="text-white/80">Capacity</TableHead>
            <TableHead className="text-white/80">Day Rate</TableHead>
            <TableHead className="text-white/80">Night Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {poolRows.map((pool) => {
            const rates = pool.rates ?? {};

            return (
              <TableRow key={pool.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-semibold">
                  <Link to={`/pools/${pool.id}`} className="text-white hover:text-[#a4d473]">
                    Pool {pool.pool_number}
                  </Link>
                </TableCell>
                <TableCell className="text-white/90">{pool.name}</TableCell>
                <TableCell className="text-white/85">{pool.capacity ?? "N/A"}</TableCell>
                <TableCell className="text-white/85">{formatCurrency(rates.day)}</TableCell>
                <TableCell className="text-white/85">{formatCurrency(rates.night)}</TableCell>
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
