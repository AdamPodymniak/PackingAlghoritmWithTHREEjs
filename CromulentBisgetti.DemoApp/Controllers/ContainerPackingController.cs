using System.Collections.Generic;
using CromulentBisgetti.ContainerPacking;
using CromulentBisgetti.ContainerPacking.Entities;
using CromulentBisgetti.DemoApp.Models;
using Microsoft.AspNetCore.Mvc;
using Sharp3DBinPacking;
using System.Linq;

namespace CromulentBisgetti.DemoApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContainerPackingController : ControllerBase
    {
        // POST api/values
        [HttpPost]
        public ActionResult<ContainerPackingResult> Post()
        {
            List<Container> containers = new List<Container>();
            List<Item> items = new List<Item>();
            Item item2 = new Item(1, 2, 2, 2, 30, "ghlasoowwdds");
            Item item1 = new Item(1, 7, 7, 7, 1, "fdnlfa292jf;fa");
            items.Add(item1);
            items.Add(item2);
            List<int> ids = new List<int>();
            ids.Add(1);
            Container container = new Container(0, 10, 10, 10);
            containers.Add(container);

            var x = PackingService.Pack(containers, items, ids);
            ContainerPackingResult result = new ContainerPackingResult();
            foreach (var o in x)
            {
                result = o;
            }
            result.ContainerLength = 10;
            result.ContainerHeight = 10;
            result.ContainerWidth = 10;
            return result;
        }
    }
}