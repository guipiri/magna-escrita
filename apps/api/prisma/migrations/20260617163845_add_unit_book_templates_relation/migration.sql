-- CreateTable
CREATE TABLE "_UnitBookTemplates" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UnitBookTemplates_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UnitBookTemplates_B_index" ON "_UnitBookTemplates"("B");

-- AddForeignKey
ALTER TABLE "_UnitBookTemplates" ADD CONSTRAINT "_UnitBookTemplates_A_fkey" FOREIGN KEY ("A") REFERENCES "BookTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UnitBookTemplates" ADD CONSTRAINT "_UnitBookTemplates_B_fkey" FOREIGN KEY ("B") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
