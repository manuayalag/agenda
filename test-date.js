// Función para probar cómo se convierten los días de la semana
const testDate = (dateString) => {
    // Método 1: Crear fecha directamente (sujeto a problemas de zona horaria)
    const date = new Date(dateString);
    
    // Método 2: Crear fecha preservando el día correcto independientemente de la zona horaria
    const [year, month, day] = dateString.split('-').map(Number);
    const datePreserved = new Date(year, month - 1, day); // Meses en JS son 0-indexed
    
    // Comparar ambos métodos
    const jsDay = date.getDay();
    const jsDayPreserved = datePreserved.getDay();
    
    const convertedDay = jsDay === 0 ? 7 : jsDay;
    const convertedDayPreserved = jsDayPreserved === 0 ? 7 : jsDayPreserved;
    
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    console.log('------------');
    console.log(`Fecha de entrada: ${dateString}`);
    console.log(`\nMétodo 1 (new Date directo):`);
    console.log(`Fecha como objeto: ${date}`);
    console.log(`Día JavaScript (0-6): ${jsDay} (${days[jsDay]})`);
    console.log(`Día convertido (1-7): ${convertedDay}`);
    
    console.log(`\nMétodo 2 (preservando componentes):`);
    console.log(`Fecha como objeto: ${datePreserved}`);
    console.log(`Día JavaScript (0-6): ${jsDayPreserved} (${days[jsDayPreserved]})`);
    console.log(`Día convertido (1-7): ${convertedDayPreserved}`);
    
    // Comprobar si estaría en [1, 3, 5]
    const workingDays = [1, 3, 5];
    console.log(`\n¿Está en días laborables [1,3,5]?`);
    console.log(`Método 1: ${workingDays.includes(convertedDay)}`);
    console.log(`Método 2: ${workingDays.includes(convertedDayPreserved)}`);

    return {
        method1: convertedDay,
        method2: convertedDayPreserved
    };
};

// Probar las fechas que nos interesan
console.log("TEST FECHAS JUNIO 2025");
testDate('2025-06-16'); // Lunes
testDate('2025-06-17'); // Martes
testDate('2025-06-18'); // Miércoles
testDate('2025-06-19'); // Jueves
testDate('2025-06-20'); // Viernes
