const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const boards = await prisma.board.findMany({ include: { columns: true } });
  for (const board of boards) {
    console.log(board.title);
    for (const c of board.columns) console.log('  ', c.title, c.position);
    
    // Check if it already has exactly 'Backlog'
    if (!board.columns.find(c => c.title === 'Backlog')) {
         console.log('Adding Backlog to', board.title);
         for (const c of board.columns) {
             if (c.position >= 1) {
                 await prisma.column.update({where: {id: c.id}, data: {position: c.position + 1}});
             }
         }
         await prisma.column.create({ 
            data: { title: 'Backlog', position: 1, color: '#94a3b8', boardId: board.id } 
         });
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
