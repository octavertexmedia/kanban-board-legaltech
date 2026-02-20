const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const boards = await prisma.board.findMany({ include: { columns: true } });
  for (const board of boards) {
    const hasBacklog = board.columns.some(c => c.title === 'Backlog');
    const hasToDo = board.columns.some(c => c.title === 'To Do');
    if (!hasBacklog && hasToDo) {
      // Shift all existing column positions up by 1 if position >= 1
      await Promise.all(board.columns.map(c => 
        prisma.column.update({ 
          where: { id: c.id }, 
          data: { position: c.position >= 1 ? c.position + 1 : c.position } 
        })
      ));
      // Insert Backlog at position 1
      await prisma.column.create({ 
        data: { title: 'Backlog', position: 1, color: '#94a3b8', boardId: board.id } 
      });
      console.log('Added Backlog to board:', board.title);
    } else {
      console.log('Board already has Backlog or no To Do:', board.title);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
