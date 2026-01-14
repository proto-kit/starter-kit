-- CreateTable
CREATE TABLE "Block" (
    "height" INTEGER NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("height")
);

-- CreateTable
CREATE TABLE "Balance" (
    "height" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "amount" TEXT NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("height","address")
);
