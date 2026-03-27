async function createPerson(req, res) {
  try {
    const { type, fullName, phone } = req.body;

    if (!type || !fullName) {
      return res.status(400).json({
        error: "Tipo e nome completo são obrigatórios."
      });
    }

    const person = await prisma.person.create({
      data: {
        type,
        fullName,
        phone
      }
    });

    return res.status(201).json({
      message: "Pessoa cadastrada com sucesso.",
      person
    });
  } catch (error) {
    console.error("Erro em createPerson:", error);
    return res.status(500).json({
      error: "Erro ao cadastrar pessoa.",
      details: error.message
    });
  }
}