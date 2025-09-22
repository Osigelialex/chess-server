-- CreateTable
CREATE TABLE "GuestGame" (
    "id" UUID NOT NULL,
    "boardState" TEXT NOT NULL,
    "moves" TEXT,
    "code" TEXT NOT NULL,
    "result" "Result",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "whitePlayerId" UUID,
    "blackPlayerId" UUID,

    CONSTRAINT "GuestGame_pkey" PRIMARY KEY ("id")
);
